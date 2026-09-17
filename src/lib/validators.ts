import { z } from "zod";
import { GeofenceService } from "@/services/geofence";

export const createOrderSchema = z
  .object({
    merchantId: z.string().min(1, "El ID de comercio es requerido"),
    pickupAddress: z.string().min(3, "La dirección de retiro es requerida"),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    dropoffAddress: z.string().min(2, "La dirección de entrega es requerida"),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    dropoffMapUrl: z.string().optional(),
    baseFee: z
      .number()
      .min(2.0, "La tarifa base debe ser de $2.00 en adelante")
      .optional(),
    recipientName: z.string().min(2, "El nombre del destinatario es requerido"),
    recipientPhone: z.string().min(5, "El teléfono de contacto es requerido"),
    packageNotes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const coverage = GeofenceService.validateDispatchCoverage(
      [val.pickupLat, val.pickupLng],
      [val.dropoffLat, val.dropoffLng]
    );
    if (!coverage.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          coverage.error ||
          "La orden está fuera de la zona autorizada de Valencia, Naguanagua y San Diego (Carabobo, Venezuela)",
        path: ["dropoffAddress"],
      });
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ASSIGNED",
    "PICKING_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
  ]),
  riderId: z.string().optional(),
});

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKING_UP", "CANCELLED"],
  PICKING_UP: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const createMerchantSchema = z
  .object({
    name: z.string().min(2, "El nombre de contacto es requerido"),
    email: z.string().email("El correo electrónico es inválido"),
    businessName: z.string().min(2, "La razón social o nombre comercial es requerido"),
    address: z.string().min(4, "La dirección comercial es requerida"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    phone: z.string().min(7, "El teléfono de contacto es requerido"),
    balance: z.number().min(0, "El saldo inicial no puede ser negativo").optional().default(0),
  })
  .superRefine((val, ctx) => {
    const coverage = GeofenceService.checkLocationCoverage(val.latitude, val.longitude);
    if (!coverage.isCovered) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          coverage.error ||
          "La ubicación del comercio está fuera de la zona autorizada de Valencia, Naguanagua y San Diego (Carabobo, Venezuela)",
        path: ["address"],
      });
    }
  });

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;

export const createRiderSchema = z.object({
  name: z.string().min(2, "El nombre del repartidor es requerido"),
  email: z.string().email("El correo electrónico es inválido"),
  phone: z.string().min(7, "El teléfono celular es requerido"),
  vehiclePlate: z
    .string()
    .min(3, "La placa vehicular es requerida")
    .max(10, "La placa es demasiado larga")
    .transform((v) => v.toUpperCase().trim()),
  status: z.enum(["IDLE", "OFFLINE"]).optional().default("IDLE"),
  currentLat: z.number().min(-90).max(90).optional(),
  currentLng: z.number().min(-180).max(180).optional(),
});

export type CreateRiderInput = z.infer<typeof createRiderSchema>;

export const updateMerchantSchema = z
  .object({
    merchantId: z.string().min(1, "El ID de comercio es requerido"),
    name: z.string().min(2, "El nombre de contacto es requerido").optional(),
    email: z.string().email("El correo electrónico es inválido").optional(),
    businessName: z.string().min(2, "La razón social o nombre comercial es requerido").optional(),
    address: z.string().min(4, "La dirección comercial es requerida").optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    phone: z.string().min(7, "El teléfono de contacto es requerido").optional(),
    balance: z.number().min(0, "El saldo no puede ser negativo").optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.latitude !== undefined && val.longitude !== undefined) {
      const coverage = GeofenceService.checkLocationCoverage(val.latitude, val.longitude);
      if (!coverage.isCovered) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            coverage.error ||
            "La ubicación del comercio está fuera de la zona autorizada de Valencia, Naguanagua y San Diego (Carabobo, Venezuela)",
          path: ["address"],
        });
      }
    }
  });

export type UpdateMerchantInput = z.infer<typeof updateMerchantSchema>;

export const updateRiderSchema = z.object({
  riderId: z.string().min(1, "El ID de repartidor es requerido"),
  name: z.string().min(2, "El nombre del repartidor es requerido").optional(),
  email: z.string().email("El correo electrónico es inválido").optional(),
  phone: z.string().min(7, "El teléfono celular es requerido").optional(),
  vehiclePlate: z
    .string()
    .min(3, "La placa vehicular es requerida")
    .max(10, "La placa es demasiado larga")
    .transform((v) => v.toUpperCase().trim())
    .optional(),
  status: z.enum(["IDLE", "BUSY", "OFFLINE"]).optional(),
  currentLat: z.number().min(-90).max(90).optional(),
  currentLng: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRiderInput = z.infer<typeof updateRiderSchema>;


