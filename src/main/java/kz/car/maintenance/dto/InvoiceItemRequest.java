package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InvoiceItemRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private Integer quantity;
    @NotNull
    private BigDecimal unitPrice;
}
