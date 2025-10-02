import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReservationData {
  reservationNumber: number
  firstName: string
  lastName: string
  phone: string
  appointmentDate: string
  appointmentTime: string
  totalPrice: number
  depositPaid: number
  artistName?: string
  notes?: string
  designImages?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reservation }: { reservation: ReservationData } = await req.json()

    // Get WhatsApp configuration from environment variables
    const WHATSAPP_PHONE_NUMBER = Deno.env.get('WHATSAPP_PHONE_NUMBER') // Your WhatsApp number
    const WHATSAPP_TARGET_NUMBER = Deno.env.get('WHATSAPP_TARGET_NUMBER') // Number to send to

    if (!WHATSAPP_PHONE_NUMBER || !WHATSAPP_TARGET_NUMBER) {
      throw new Error('WhatsApp configuration missing')
    }

    // Format the message (WhatsApp uses different formatting than Telegram)
    const remainingAmount = reservation.totalPrice - reservation.depositPaid
    const message = `
🎨 *New Reservation Created* 🎨

📋 *Reservation #${reservation.reservationNumber}*

👤 *Customer:* ${reservation.firstName} ${reservation.lastName}
📞 *Phone:* ${reservation.phone}
📅 *Date:* ${new Date(reservation.appointmentDate).toLocaleDateString('en-GB')}
🕐 *Time:* ${reservation.appointmentTime}
${reservation.artistName ? `🎨 *Artist:* ${reservation.artistName}` : ''}

💰 *Total Price:* €${reservation.totalPrice.toFixed(2)}
💳 *Deposit:* €${reservation.depositPaid.toFixed(2)}
💸 *Remaining:* €${remainingAmount.toFixed(2)}

${reservation.notes ? `📝 *Notes:* ${reservation.notes}` : ''}

🏪 *Krampus Tattoo Studio*
    `.trim()

    // Since we can't run whatsapp-web.js directly in Supabase Edge Functions,
    // we'll use a webhook approach to a separate WhatsApp service
    const whatsappWebhookUrl = Deno.env.get('WHATSAPP_WEBHOOK_URL')
    
    if (!whatsappWebhookUrl) {
      throw new Error('WhatsApp webhook URL not configured')
    }

    // Send to WhatsApp service
    const response = await fetch(whatsappWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: WHATSAPP_TARGET_NUMBER,
        message: message,
        images: reservation.designImages || []
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`WhatsApp API error: ${errorData}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending WhatsApp notification:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})