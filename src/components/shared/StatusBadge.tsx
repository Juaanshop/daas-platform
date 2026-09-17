import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  UserCheck,
  Package,
  Bike,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="warning" pulse className={className}>
          <Clock className="w-3 h-3" />
          Pendiente
        </Badge>
      );
    case "ASSIGNED":
      return (
        <Badge variant="info" pulse className={className}>
          <UserCheck className="w-3 h-3" />
          Asignado
        </Badge>
      );
    case "PICKING_UP":
      return (
        <Badge variant="purple" pulse className={className}>
          <Package className="w-3 h-3" />
          En Local
        </Badge>
      );
    case "IN_TRANSIT":
      return (
        <Badge variant="success" pulse className={className}>
          <Bike className="w-3 h-3 animate-bounce" />
          En Tránsito
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3 h-3" />
          Entregado
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="destructive" className={className}>
          <XCircle className="w-3 h-3" />
          Cancelado
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className={className}>
          {status}
        </Badge>
      );
  }
}

