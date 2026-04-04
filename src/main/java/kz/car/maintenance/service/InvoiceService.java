package kz.car.maintenance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import kz.car.maintenance.dto.InvoiceCreateRequest;
import kz.car.maintenance.dto.InvoiceResponse;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.Invoice;
import kz.car.maintenance.model.MaintenanceRecord;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.BookingRepository;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.repository.InvoiceRepository;
import kz.car.maintenance.repository.MaintenanceRecordRepository;
import kz.car.maintenance.repository.ServiceCenterClientRepository;
import kz.car.maintenance.repository.ServiceCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final ServiceCenterClientRepository serviceCenterClientRepository;
    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Transactional
    public InvoiceResponse createInvoice(Long serviceCenterUserId, InvoiceCreateRequest request) {
        ServiceCenter serviceCenter = getMyServiceCenter(serviceCenterUserId);

        MaintenanceRecord maintenanceRecord = null;
        Car car;
        User client;

        if (request.getMaintenanceRecordId() != null) {
            maintenanceRecord = maintenanceRecordRepository.findById(request.getMaintenanceRecordId())
                    .orElseThrow(() -> new NotFoundException("Maintenance record not found"));

            if (maintenanceRecord.getServiceCenter() == null
                    || !maintenanceRecord.getServiceCenter().getId().equals(serviceCenter.getId())) {
                throw new ForbiddenException("You can create invoices only for operations of your service center");
            }

            if (invoiceRepository.findByMaintenanceRecord(maintenanceRecord).isPresent()) {
                throw new BadRequestException("Invoice already exists for this operation");
            }

            car = maintenanceRecord.getCar();
            if (car == null || car.getOwner() == null) {
                throw new BadRequestException("Maintenance record has no linked car/client");
            }

            client = car.getOwner();
        } else {
            if (request.getCarId() == null || request.getClientId() == null) {
                throw new BadRequestException("Provide maintenanceRecordId or both clientId and carId");
            }

            car = carRepository.findById(request.getCarId())
                    .orElseThrow(() -> new NotFoundException("Car not found"));
            client = userService.findById(request.getClientId());

            if (car.getOwner() == null || !car.getOwner().getId().equals(client.getId())) {
                throw new BadRequestException("Selected car does not belong to selected client");
            }

            ensureClientBelongsToServiceCenterScope(serviceCenter, client, car);
        }

        String itemsJson;
        try {
            itemsJson = objectMapper.writeValueAsString(request.getItems());
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Failed to serialize invoice items");
        }

        Invoice invoice = Invoice.builder()
                .maintenanceRecord(maintenanceRecord)
                .serviceCenter(serviceCenter)
                .car(car)
                .client(client)
                .invoiceNumber(generateInvoiceNumber())
                .issueDate(LocalDate.now())
                .totalAmount(request.getAmount())
                .taxAmount(request.getTaxAmount())
                .currency(request.getCurrency() == null || request.getCurrency().isBlank() ? "KZT" : request.getCurrency())
                .status(Invoice.InvoiceStatus.CREATED)
                .notes(request.getNotes())
                .items(itemsJson)
                .build();

        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    public List<InvoiceResponse> getMyServiceCenterInvoices(Long serviceCenterUserId) {
        ServiceCenter serviceCenter = getMyServiceCenter(serviceCenterUserId);
        return invoiceRepository.findByServiceCenterOrderByCreatedAtDesc(serviceCenter)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<InvoiceResponse> getMyInvoices(Long userId) {
        User user = userService.findById(userId);
        if (user.getRole() == User.UserRole.SERVICE_CENTER) {
            return getMyServiceCenterInvoices(userId);
        }

        List<Car> cars = carRepository.findByOwner(user);
        if (cars.isEmpty()) {
            return List.of();
        }

        return invoiceRepository.findByCarInOrderByCreatedAtDesc(cars)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public InvoiceResponse getInvoiceById(Long invoiceId, Long requesterId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        ensureInvoiceAccess(invoice, requesterId);
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse updateInvoiceStatus(Long invoiceId, Invoice.InvoiceStatus status, Long requesterId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found"));
        ensureServiceCenterInvoiceAccess(invoice, requesterId);

        invoice.setStatus(status);
        invoice = invoiceRepository.save(invoice);
        return toResponse(invoice);
    }

    private void ensureInvoiceAccess(Invoice invoice, Long requesterId) {
        User requester = userService.findById(requesterId);
        boolean isAdmin = requester.getRole() == User.UserRole.ADMIN;
        boolean isServiceCenterOwner = invoice.getServiceCenter() != null
                && invoice.getServiceCenter().getUser() != null
                && invoice.getServiceCenter().getUser().getId().equals(requesterId);
        boolean isCarOwner = invoice.getCar() != null
                && invoice.getCar().getOwner() != null
                && invoice.getCar().getOwner().getId().equals(requesterId);

        if (!isAdmin && !isServiceCenterOwner && !isCarOwner) {
            throw new ForbiddenException("You don't have permission to view this invoice");
        }
    }

    private void ensureServiceCenterInvoiceAccess(Invoice invoice, Long requesterId) {
        User requester = userService.findById(requesterId);
        boolean isAdmin = requester.getRole() == User.UserRole.ADMIN;
        boolean isServiceCenterOwner = invoice.getServiceCenter() != null
                && invoice.getServiceCenter().getUser() != null
                && invoice.getServiceCenter().getUser().getId().equals(requesterId);

        if (!isAdmin && !isServiceCenterOwner) {
            throw new ForbiddenException("You don't have permission to update this invoice");
        }
    }

    private void ensureClientBelongsToServiceCenterScope(ServiceCenter serviceCenter, User client, Car car) {
        boolean hasDirectRelation = serviceCenterClientRepository
                .findByServiceCenterAndClient(serviceCenter, client)
                .isPresent();
        boolean hasBooking = bookingRepository.existsByServiceCenterAndCar(serviceCenter, car);
        boolean hasServiceHistory = !maintenanceRecordRepository
                .findByServiceCenterAndCarOrderByServiceDateDesc(serviceCenter, car)
                .isEmpty();

        if (!hasDirectRelation && !hasBooking && !hasServiceHistory) {
            throw new ForbiddenException("You can create invoices only for your service center clients/cars");
        }
    }

    private ServiceCenter getMyServiceCenter(Long serviceCenterUserId) {
        User user = userService.findById(serviceCenterUserId);
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("Only service center users can access this endpoint");
        }

        return serviceCenterRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Service center profile not found"));
    }

    private String generateInvoiceNumber() {
        return "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        String carTitle = null;
        if (invoice.getCar() != null) {
            carTitle = invoice.getCar().getBrand() + " " + invoice.getCar().getModel()
                    + (invoice.getCar().getLicensePlate() != null ? " (" + invoice.getCar().getLicensePlate() + ")" : "");
        }

        String clientName = null;
        if (invoice.getClient() != null) {
            clientName = invoice.getClient().getFirstName() + " " + invoice.getClient().getLastName();
        }

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .issueDate(invoice.getIssueDate())
                .totalAmount(invoice.getTotalAmount())
                .taxAmount(invoice.getTaxAmount())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus())
                .notes(invoice.getNotes())
                .items(invoice.getItems())
                .maintenanceRecordId(invoice.getMaintenanceRecord() != null ? invoice.getMaintenanceRecord().getId() : null)
                .carId(invoice.getCar() != null ? invoice.getCar().getId() : null)
                .carTitle(carTitle)
                .clientId(invoice.getClient() != null ? invoice.getClient().getId() : null)
                .clientName(clientName)
                .serviceCenterId(invoice.getServiceCenter() != null ? invoice.getServiceCenter().getId() : null)
                .serviceCenterName(invoice.getServiceCenter() != null ? invoice.getServiceCenter().getName() : null)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
