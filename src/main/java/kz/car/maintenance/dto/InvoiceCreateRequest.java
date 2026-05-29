package kz.car.maintenance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class InvoiceCreateRequest {

    private Long maintenanceRecordId;

    private Long carId;

    private Long clientId;

    @DecimalMin("0.0")
    private BigDecimal amount;

    private BigDecimal taxAmount;

    private String currency;

    private String notes;

    @Valid
    private List<InvoiceItemRequest> items = new ArrayList<>();
}
