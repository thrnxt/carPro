package kz.car.maintenance.dto;

import kz.car.maintenance.model.Invoice;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private LocalDate issueDate;
    private BigDecimal totalAmount;
    private BigDecimal taxAmount;
    private String currency;
    private Invoice.InvoiceStatus status;
    private String notes;
    private String items;
    private Long maintenanceRecordId;
    private Long carId;
    private String carTitle;
    private Long clientId;
    private String clientName;
    private Long serviceCenterId;
    private String serviceCenterName;
    private LocalDateTime createdAt;
}
