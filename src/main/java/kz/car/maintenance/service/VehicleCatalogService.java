package kz.car.maintenance.service;

import kz.car.maintenance.dto.VehicleCatalogDto;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.VehicleCatalog;
import kz.car.maintenance.repository.VehicleCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VehicleCatalogService {

    private final VehicleCatalogRepository vehicleCatalogRepository;

    public VehicleCatalogDto getByVin(String vin) {
        return toDto(findEntityByVin(vin));
    }

    public VehicleCatalog findEntityByVin(String vin) {
        String normalizedVin = normalizeVin(vin);
        if (normalizedVin == null) {
            throw new BadRequestException("VIN is required");
        }

        return vehicleCatalogRepository.findByVin(normalizedVin)
                .orElseThrow(() -> new NotFoundException("Car with this VIN was not found in catalog"));
    }

    private VehicleCatalogDto toDto(VehicleCatalog vehicleCatalog) {
        return VehicleCatalogDto.builder()
                .vin(vehicleCatalog.getVin())
                .brand(vehicleCatalog.getBrand())
                .model(vehicleCatalog.getModel())
                .year(vehicleCatalog.getYear())
                .color(vehicleCatalog.getColor())
                .licensePlate(vehicleCatalog.getLicensePlate())
                .mileage(vehicleCatalog.getMileage())
                .build();
    }

    private String normalizeVin(String vin) {
        if (vin == null) {
            return null;
        }

        String normalizedVin = vin.trim().toUpperCase();
        if (normalizedVin.isBlank()) {
            return null;
        }

        if (normalizedVin.length() != 17) {
            throw new BadRequestException("VIN must contain 17 characters");
        }

        return normalizedVin;
    }
}
