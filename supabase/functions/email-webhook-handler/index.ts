import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InboundEmailPayload {
  sender: string;
  from: string;
  recipient: string;
  subject: string;
  "body-plain"?: string;
  "body-html"?: string;
  "stripped-text"?: string;
  "stripped-html"?: string;
  "message-headers"?: string;
  "Message-Id"?: string;
  timestamp?: string;
  attachments?: Array<{
    filename: string;
    "content-type": string;
    size: number;
    url?: string;
  }>;
  [key: string]: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const contentType = req.headers.get("content-type") || "";
    let emailData: InboundEmailPayload;

    if (contentType.includes("application/json")) {
      emailData = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      emailData = {} as InboundEmailPayload;
      
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") {
          emailData[key] = value;
        }
      }
    } else {
      throw new Error("Unsupported content type");
    }

    console.log("Received email data:", {
      from: emailData.sender || emailData.from,
      to: emailData.recipient,
      subject: emailData.subject,
    });

    const messageId = emailData["Message-Id"] || emailData.sender + "-" + Date.now();
    const fromAddress = emailData.sender || emailData.from || "unknown@sender.com";
    const toAddresses = emailData.recipient ? [emailData.recipient] : [];

    let headers = null;
    if (emailData["message-headers"]) {
      try {
        headers = typeof emailData["message-headers"] === "string" 
          ? JSON.parse(emailData["message-headers"]) 
          : emailData["message-headers"];
      } catch (e) {
        console.warn("Could not parse message headers", e);
      }
    }

    const { data: email, error: emailError } = await supabase
      .from("emails")
      .insert({
        message_id: messageId,
        from_address: fromAddress,
        from_name: emailData.from || fromAddress,
        to_addresses: toAddresses,
        subject: emailData.subject || "(No Subject)",
        body_text: emailData["stripped-text"] || emailData["body-plain"] || "",
        body_html: emailData["stripped-html"] || emailData["body-html"] || "",
        headers: headers,
        is_read: false,
        is_archived: false,
        direction: "inbound",
        received_at: emailData.timestamp ? new Date(parseInt(emailData.timestamp) * 1000).toISOString() : new Date().toISOString(),
      })
      .select()
      .single();

    if (emailError) {
      console.error("Error inserting email:", emailError);
      throw emailError;
    }

    console.log("Email inserted successfully:", email.id);

    if (emailData.attachments && Array.isArray(emailData.attachments) && emailData.attachments.length > 0) {
      console.log(`Processing ${emailData.attachments.length} attachments`);

      for (const attachment of emailData.attachments) {
        try {
          const { error: attachmentError } = await supabase
            .from("email_attachments")
            .insert({
              email_id: email.id,
              filename: attachment.filename || "unknown",
              content_type: attachment["content-type"] || "application/octet-stream",
              size_bytes: attachment.size || 0,
              storage_path: attachment.url || "",
            });

          if (attachmentError) {
            console.error("Error inserting attachment:", attachmentError);
          }
        } catch (attachmentErr) {
          console.error("Error processing attachment:", attachmentErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: email.id,
        message: "Email processed successfully" 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing email webhook:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error" 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});