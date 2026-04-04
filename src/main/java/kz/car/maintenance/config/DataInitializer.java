package kz.car.maintenance.config;

import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.model.VehicleCatalog;
import kz.car.maintenance.repository.ServiceCenterRepository;
import kz.car.maintenance.repository.UserRepository;
import kz.car.maintenance.repository.VehicleCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.IntStream;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {
    
    private final UserRepository userRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final VehicleCatalogRepository vehicleCatalogRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Bean
    @Transactional
    public CommandLineRunner initServiceCenters() {
        return args -> {
            // Проверяем, есть ли уже сервисные центры
            if (serviceCenterRepository.count() > 0) {
                return; // Уже инициализировано
            }
            
            List<ServiceCenterData> serviceCentersData = Arrays.asList(
                new ServiceCenterData(
                    "service1@example.com",
                    "service123",
                    "АвтоМастер",
                    "ул. Абая, 150",
                    "Алматы",
                    "Алматинская область",
                    new BigDecimal("43.2220"),
                    new BigDecimal("76.8512"),
                    "+7 (727) 123-45-67",
                    "info@automaster.kz",
                    "https://automaster.kz",
                    "Полный спектр услуг по обслуживанию и ремонту автомобилей. Диагностика, ТО, ремонт двигателя, подвески, тормозов.",
                    "SC-ALM-001"
                ),
                new ServiceCenterData(
                    "service2@example.com",
                    "service123",
                    "ТехноСервис",
                    "пр. Кабанбай батыра, 12",
                    "Астана",
                    "Акмолинская область",
                    new BigDecimal("51.1694"),
                    new BigDecimal("71.4491"),
                    "+7 (7172) 456-78-90",
                    "info@technoservice.kz",
                    "https://technoservice.kz",
                    "Современный автосервис с новейшим оборудованием. Специализация: немецкие и японские автомобили.",
                    "SC-AST-002"
                ),
                new ServiceCenterData(
                    "service3@example.com",
                    "service123",
                    "Быстрый Ремонт",
                    "ул. Тауке хана, 45",
                    "Шымкент",
                    "Туркестанская область",
                    new BigDecimal("42.3419"),
                    new BigDecimal("69.5901"),
                    "+7 (7252) 789-01-23",
                    "info@fastrepair.kz",
                    null,
                    "Экспресс-ремонт и обслуживание. Гарантия качества. Работаем без выходных.",
                    "SC-SHY-003"
                ),
                new ServiceCenterData(
                    "service4@example.com",
                    "service123",
                    "Профи Авто",
                    "ул. Бухар жырау, 78",
                    "Караганда",
                    "Карагандинская область",
                    new BigDecimal("49.8014"),
                    new BigDecimal("73.1059"),
                    "+7 (7212) 234-56-78",
                    "info@profiauto.kz",
                    "https://profiauto.kz",
                    "Профессиональное обслуживание всех марок автомобилей. Шиномонтаж, покраска, кузовной ремонт.",
                    "SC-KAR-004"
                ),
                new ServiceCenterData(
                    "service5@example.com",
                    "service123",
                    "Мотор Ленд",
                    "пр. Абиша Кекилбаева, 23",
                    "Актобе",
                    "Актюбинская область",
                    new BigDecimal("50.2800"),
                    new BigDecimal("57.2100"),
                    "+7 (7132) 345-67-89",
                    "info@motorland.kz",
                    null,
                    "Качественный ремонт двигателей и трансмиссии. Оригинальные запчасти. Гарантия.",
                    "SC-AKT-005"
                )
            );
            
            for (ServiceCenterData data : serviceCentersData) {
                // Создаем пользователя, если не существует
                User user = userRepository.findByEmail(data.email)
                        .orElseGet(() -> {
                            User newUser = User.builder()
                                    .email(data.email)
                                    .password(passwordEncoder.encode(data.password))
                                    .firstName("Сервис")
                                    .lastName(data.name)
                                    .role(User.UserRole.SERVICE_CENTER)
                                    .status(User.UserStatus.ACTIVE)
                                    .build();
                            return userRepository.save(newUser);
                        });
                
                // Создаем сервисный центр, если не существует
                if (serviceCenterRepository.findByUser(user).isEmpty()) {
                    ServiceCenter serviceCenter = ServiceCenter.builder()
                            .user(user)
                            .name(data.name)
                            .address(data.address)
                            .city(data.city)
                            .region(data.region)
                            .latitude(data.latitude)
                            .longitude(data.longitude)
                            .phoneNumber(data.phoneNumber)
                            .email(data.emailContact != null ? data.emailContact : data.email)
                            .website(data.website)
                            .description(data.description)
                            .status(ServiceCenter.ServiceCenterStatus.ACTIVE)
                            .licenseNumber(data.licenseNumber)
                            .rating(new BigDecimal("4.5"))
                            .reviewCount(0)
                            .build();
                    
                    serviceCenterRepository.save(serviceCenter);
                }
            }
        };
    }

    @Bean
    @Transactional
    public CommandLineRunner initVehicleCatalog() {
        return args -> buildVehicleCatalogSeeds().forEach(seed -> {
            if (vehicleCatalogRepository.existsByVin(seed.vin())) {
                return;
            }

            VehicleCatalog vehicleCatalog = VehicleCatalog.builder()
                    .vin(seed.vin())
                    .brand(seed.brand())
                    .model(seed.model())
                    .year(seed.year())
                    .color(seed.color())
                    .licensePlate(seed.licensePlate())
                    .mileage(seed.mileage())
                    .build();

            vehicleCatalogRepository.save(vehicleCatalog);
        });
    }

    private List<VehicleCatalogSeed> buildVehicleCatalogSeeds() {
        List<VehiclePattern> patterns = List.of(
                new VehiclePattern("Toyota", "Camry"),
                new VehiclePattern("Hyundai", "Tucson"),
                new VehiclePattern("Kia", "Sportage"),
                new VehiclePattern("Chevrolet", "Cobalt"),
                new VehiclePattern("BMW", "5 Series"),
                new VehiclePattern("Mercedes-Benz", "E-Class"),
                new VehiclePattern("Volkswagen", "Passat"),
                new VehiclePattern("Lexus", "RX 350"),
                new VehiclePattern("Nissan", "X-Trail"),
                new VehiclePattern("Audi", "A6")
        );
        List<String> colors = List.of("Белый", "Черный", "Серый", "Синий", "Красный");
        List<Integer> years = List.of(2018, 2019, 2020, 2021, 2022);

        return IntStream.range(0, patterns.size())
                .boxed()
                .flatMap(patternIndex -> IntStream.range(0, colors.size())
                        .mapToObj(colorIndex -> {
                            int seedIndex = patternIndex * colors.size() + colorIndex + 1;
                            VehiclePattern pattern = patterns.get(patternIndex);

                            return new VehicleCatalogSeed(
                                    buildVin(patternIndex, colorIndex, seedIndex),
                                    pattern.brand(),
                                    pattern.model(),
                                    years.get((patternIndex + colorIndex) % years.size()),
                                    colors.get(colorIndex),
                                    buildLicensePlate(patternIndex, seedIndex),
                                    22000L + seedIndex * 3600L
                            );
                        }))
                .toList();
    }

    private String buildVin(int patternIndex, int colorIndex, int seedIndex) {
        return "KZA" + String.format("%02d%02d%010d", patternIndex + 1, colorIndex + 1, seedIndex * 137L);
    }

    private String buildLicensePlate(int patternIndex, int seedIndex) {
        return String.format("%02dCAR%03d", patternIndex + 1, seedIndex);
    }
    
    private static class ServiceCenterData {
        String email;
        String password;
        String name;
        String address;
        String city;
        String region;
        BigDecimal latitude;
        BigDecimal longitude;
        String phoneNumber;
        String emailContact;
        String website;
        String description;
        String licenseNumber;
        
        ServiceCenterData(String email, String password, String name, String address, String city,
                         String region, BigDecimal latitude, BigDecimal longitude, String phoneNumber,
                         String emailContact, String website, String description, String licenseNumber) {
            this.email = email;
            this.password = password;
            this.name = name;
            this.address = address;
            this.city = city;
            this.region = region;
            this.latitude = latitude;
            this.longitude = longitude;
            this.phoneNumber = phoneNumber;
            this.emailContact = emailContact;
            this.website = website;
            this.description = description;
            this.licenseNumber = licenseNumber;
        }
    }

    private record VehiclePattern(String brand, String model) {
    }

    private record VehicleCatalogSeed(
            String vin,
            String brand,
            String model,
            Integer year,
            String color,
            String licensePlate,
            Long mileage
    ) {
    }
}
