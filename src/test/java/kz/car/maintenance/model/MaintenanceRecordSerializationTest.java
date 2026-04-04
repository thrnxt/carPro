package kz.car.maintenance.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import kz.car.maintenance.config.JacksonConfig;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class MaintenanceRecordSerializationTest {

    private final ObjectMapper objectMapper =
            new JacksonConfig().objectMapper(new Jackson2ObjectMapperBuilder());

    @Test
    void serializesMaintenanceRecordWithChildrenWithoutBackReferenceLoop() throws Exception {
        User owner = User.builder()
                .id(10L)
                .email("client@example.com")
                .firstName("Test")
                .lastName("Client")
                .role(User.UserRole.USER)
                .status(User.UserStatus.ACTIVE)
                .build();

        Car car = Car.builder()
                .id(20L)
                .owner(owner)
                .brand("Toyota")
                .model("Camry")
                .year(2020)
                .licensePlate("123ABC")
                .mileage(12000L)
                .build();

        CarComponent component = CarComponent.builder()
                .id(30L)
                .name("Шатуны")
                .status(CarComponent.ComponentStatus.NEW)
                .wearLevel(5)
                .build();

        MaintenanceRecord record = MaintenanceRecord.builder()
                .id(40L)
                .car(car)
                .workType("Замена деталей")
                .serviceDate(LocalDate.of(2026, 4, 2))
                .mileageAtService(32000L)
                .status(MaintenanceRecord.RecordStatus.COMPLETED)
                .build();

        MaintenancePhoto photo = MaintenancePhoto.builder()
                .id(50L)
                .maintenanceRecord(record)
                .fileUrl("/uploads/maintenance/photo.png")
                .description("Фото ремонта")
                .build();

        ReplacedComponent replacedComponent = ReplacedComponent.builder()
                .id(60L)
                .maintenanceRecord(record)
                .carComponent(component)
                .replacementDate(LocalDate.of(2026, 4, 2))
                .partNumber("123123123")
                .manufacturer("OEM")
                .build();

        Invoice invoice = Invoice.builder()
                .id(70L)
                .maintenanceRecord(record)
                .invoiceNumber("INV-001")
                .issueDate(LocalDate.of(2026, 4, 2))
                .totalAmount(java.math.BigDecimal.valueOf(95000))
                .currency("KZT")
                .status(Invoice.InvoiceStatus.CREATED)
                .pdfUrl("/uploads/invoices/inv-001.pdf")
                .build();

        record.setPhotos(Set.of(photo));
        record.setReplacedComponents(Set.of(replacedComponent));
        record.setInvoice(invoice);

        String json = objectMapper.writeValueAsString(record);

        assertThat(json).contains("\"photos\"");
        assertThat(json).contains("\"replacedComponents\"");
        assertThat(json).contains("\"invoice\"");
        assertThat(json).doesNotContain("maintenanceRecord");
        assertThat(json).contains("Шатуны");
        assertThat(json).contains("Фото ремонта");
        assertThat(json).contains("INV-001");
    }
}
