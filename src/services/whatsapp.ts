import { getGoogleMapsSearchUrl, getGoogleMapsNavigationUrl } from "@/lib/maps";

export interface WhatsAppOrderDetails {
  orderNumber: string;
  totalCost: number;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  recipientName: string;
  recipientPhone: string;
  packageNotes?: string | null;
  merchantName: string;
  merchantPhone: string;
  riderName: string;
  riderPhone: string;
}

export interface WhatsAppNotificationResult {
  phone: string;
  cleanPhone: string;
  message: string;
  whatsappUrl: string;
}

export class WhatsAppService {
  /**
   * Limpia un número de teléfono a formato internacional E.164 numérico para wa.me
   */
  static cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^0-9]/g, "");
  }

  /**
   * Construye el mensaje formateado de despacho y la URL directa para WhatsApp
   */
  static generateDispatchNotification(
    data: WhatsAppOrderDetails
  ): WhatsAppNotificationResult {
    const cleanPhone = this.cleanPhoneNumber(data.riderPhone);
    const pickupMapUrl = getGoogleMapsSearchUrl(
      data.pickupLat,
      data.pickupLng,
      data.pickupAddress
    );
    const dropoffMapUrl = getGoogleMapsSearchUrl(
      data.dropoffLat,
      data.dropoffLng,
      data.dropoffAddress
    );
    const navigationUrl = getGoogleMapsNavigationUrl(
      data.dropoffLat,
      data.dropoffLng
    );

    const riderFee = (data.totalCost * 0.8).toFixed(2);

    const message = `🛵 *NUEVO DESPACHO ASIGNADO - DaaS Flash*
Hola *${data.riderName}*, se te ha asignado el despacho *${data.orderNumber}*.
💰 *Tu ganancia estimada:* $${riderFee}

━━━━━━━━━━━━━━━━━━━━
🏪 *1. RETIRO EN COMERCIO:*
• *Local:* ${data.merchantName}
• *Dirección:* ${data.pickupAddress}
• *Teléfono:* ${data.merchantPhone}
📍 *Mapa Retiro:* ${pickupMapUrl}

━━━━━━━━━━━━━━━━━━━━
👤 *2. ENTREGA A CLIENTE:*
• *Destinatario:* ${data.recipientName}
• *Teléfono:* ${data.recipientPhone}
• *Dirección:* ${data.dropoffAddress}
${data.packageNotes ? `📝 *Instrucciones:* ${data.packageNotes}\n` : ""}📍 *Link Google Maps Destino:*
${dropoffMapUrl}

🗺️ *Iniciar Navegación GPS:*
${navigationUrl}

━━━━━━━━━━━━━━━━━━━━
_¡Por favor confirma la recepción y conduce con precaución!_`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      message
    )}`;

    return {
      phone: data.riderPhone,
      cleanPhone,
      message,
      whatsappUrl,
    };
  }

  /**
   * Genera el enlace directo para que el comercio contacte al cliente final por WhatsApp
   */
  static getCustomerWhatsAppUrl(
    recipientPhone: string,
    recipientName: string,
    orderNumber: string,
    merchantName?: string
  ): string {
    const cleanPhone = this.cleanPhoneNumber(recipientPhone);
    const storeText = merchantName ? ` del local *${merchantName}*` : "";
    const message = `Hola *${recipientName}*, te contactamos${storeText} respecto a tu orden *${orderNumber}*. ¡Tu despacho ya está siendo coordinado por nuestra flota!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}
