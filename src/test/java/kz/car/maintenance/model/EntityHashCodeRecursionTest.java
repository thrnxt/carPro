package kz.car.maintenance.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatCode;

class EntityHashCodeRecursionTest {

    @Test
    void hashCodeDoesNotRecurseForServiceOperationGraph() {
        User serviceUser = User.builder()
                .id(3L)
                .email("service1@example.com")
                .firstName("Service")
                .lastName("Center")
                .role(User.UserRole.SERVICE_CENTER)
                .status(User.UserStatus.ACTIVE)
                .build();

        ServiceCenter serviceCenter = ServiceCenter.builder()
                .id(1L)
                .user(serviceUser)
                .name("АвтоМастер")
                .address("ул. Абая, 150")
                .latitude(new BigDecimal("43.22"))
                .longitude(new BigDecimal("76.85"))
                .status(ServiceCenter.ServiceCenterStatus.ACTIVE)
                .build();
        serviceUser.setServiceCenter(serviceCenter);

        User owner = User.builder()
                .id(9L)
                .email("client@example.com")
                .firstName("Client")
                .lastName("Owner")
                .role(User.UserRole.USER)
                .status(User.UserStatus.ACTIVE)
                .build();

        Car car = Car.builder()
                .id(9L)
                .owner(owner)
                .brand("Toyota")
                .model("Camry")
                .year(2018)
                .licensePlate("01CAR001")
                .mileage(50000L)
                .build();

        CarComponent component = CarComponent.builder()
                .id(543L)
                .car(car)
                .name("Масло двигателя")
                .category("Двигатель")
                .maxMileage(10000L)
                .maxMonths(12)
                .wearLevel(100)
                .status(CarComponent.ComponentStatus.CRITICAL)
                .build();
        car.setComponents(Set.of(component));

        MaintenanceRecord record = MaintenanceRecord.builder()
                .id(100L)
                .car(car)
                .serviceCenter(serviceCenter)
                .workType("замена масла")
                .serviceDate(LocalDate.of(2026, 4, 3))
                .mileageAtService(50000L)
                .status(MaintenanceRecord.RecordStatus.COMPLETED)
                .build();

        ReplacedComponent replacedComponent = ReplacedComponent.builder()
                .id(200L)
                .maintenanceRecord(record)
                .carComponent(component)
                .replacementDate(LocalDate.of(2026, 4, 3))
                .partNumber("7777777")
                .manufacturer("oem")
                .build();

        MaintenancePhoto photo = MaintenancePhoto.builder()
                .id(300L)
                .maintenanceRecord(record)
                .fileUrl("/uploads/maintenance/test.png")
                .description("test")
                .build();

        record.setReplacedComponents(new HashSet<>(Set.of(replacedComponent)));
        record.setPhotos(new HashSet<>(Set.of(photo)));
        serviceCenter.setMaintenanceRecords(new HashSet<>(Set.of(record)));

        assertThatCode(replacedComponent::hashCode).doesNotThrowAnyException();
        assertThatCode(photo::hashCode).doesNotThrowAnyException();
        assertThatCode(record::hashCode).doesNotThrowAnyException();
        assertThatCode(serviceCenter::hashCode).doesNotThrowAnyException();
        assertThatCode(serviceUser::hashCode).doesNotThrowAnyException();
    }
}
