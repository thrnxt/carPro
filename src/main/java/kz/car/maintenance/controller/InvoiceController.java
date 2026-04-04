package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.InvoiceCreateRequest;
import kz.car.maintenance.dto.InvoiceResponse;
import kz.car.maintenance.model.Invoice;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/service-center")
    public ResponseEntity<InvoiceResponse> createInvoice(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody InvoiceCreateRequest request
    ) {
        return ResponseEntity.ok(invoiceService.createInvoice(user.getId(), request));
    }

    @GetMapping("/service-center/my")
    public ResponseEntity<List<InvoiceResponse>> getMyServiceCenterInvoices(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(invoiceService.getMyServiceCenterInvoices(user.getId()));
    }

    @PatchMapping("/service-center/{id}/status")
    public ResponseEntity<InvoiceResponse> updateInvoiceStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam Invoice.InvoiceStatus status
    ) {
        return ResponseEntity.ok(invoiceService.updateInvoiceStatus(id, status, user.getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(invoiceService.getMyInvoices(user.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id, user.getId()));
    }
}
