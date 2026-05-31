package kz.car.maintenance.service;

import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.CarComponent;
import kz.car.maintenance.repository.CarComponentRepository;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class CarComponentService {
    
    private final CarComponentRepository carComponentRepository;
    private final CarRepository carRepository;
    
    @Autowired
    @Lazy
    private NotificationService notificationService;
    
    public CarComponentService(CarComponentRepository carComponentRepository, CarRepository carRepository) {
        this.carComponentRepository = carComponentRepository;
        this.carRepository = carRepository;
    }
    
    @Transactional
    public void initializeDefaultComponents(Car car) {
        // Тип авто определяет набор деталей. Для старых записей без типа — безопасные дефолты.
        Car.PowertrainType pt = car.getPowertrainType() != null ? car.getPowertrainType() : Car.PowertrainType.PETROL;
        Car.TransmissionType tr = car.getTransmissionType() != null ? car.getTransmissionType() : Car.TransmissionType.AUTOMATIC;
        Car.DrivetrainType dr = car.getDrivetrainType() != null ? car.getDrivetrainType() : Car.DrivetrainType.FWD;

        // Очищенный каталог деталей с применимостью по типу двигателя / КПП / привода.
        // Коэффициент износа: 0.1-0.5 (медленный), 0.6-1.0 (нормальный), 1.1-1.5 (быстрый), 1.6-2.0 (очень быстрый)
        List<ComponentTemplate> templates = Arrays.asList(
            // ─── ОБЩИЕ (любой тип двигателя) ─────────────────────────────────
            // Тормоза
            new ComponentTemplate("Тормозные колодки передние", "Тормоза", "Тормозные механизмы", "🛑", 40000L, 36, 1.5),
            new ComponentTemplate("Тормозные колодки задние", "Тормоза", "Тормозные механизмы", "🛑", 50000L, 48, 1.3),
            new ComponentTemplate("Тормозные диски передние", "Тормоза", "Тормозные механизмы", "⭕", 60000L, 60, 1.2),
            new ComponentTemplate("Тормозные диски задние", "Тормоза", "Тормозные механизмы", "⭕", 80000L, 72, 1.0),
            new ComponentTemplate("Тормозная жидкость", "Тормоза", "Гидравлическая система", "💧", 60000L, 24, 1.0),
            new ComponentTemplate("Тормозные шланги", "Тормоза", "Гидравлическая система", "🔧", 100000L, 96, 0.8),
            // Подвеска
            new ComponentTemplate("Амортизаторы передние", "Подвеска", "Амортизаторы", "🔧", 80000L, 60, 1.1),
            new ComponentTemplate("Амортизаторы задние", "Подвеска", "Амортизаторы", "🔧", 80000L, 60, 1.0),
            new ComponentTemplate("Пружины передние", "Подвеска", "Амортизаторы", "🌀", 150000L, 120, 0.6),
            new ComponentTemplate("Пружины задние", "Подвеска", "Амортизаторы", "🌀", 150000L, 120, 0.6),
            new ComponentTemplate("Стойки стабилизатора", "Подвеска", "Стабилизаторы", "🔩", 60000L, 48, 1.2),
            new ComponentTemplate("Сайлентблоки", "Подвеска", "Резинотехнические изделия", "🔧", 80000L, 72, 1.1),
            new ComponentTemplate("Шаровые опоры", "Подвеска", "Шарниры", "⚙️", 100000L, 96, 1.0),
            new ComponentTemplate("Опорные подшипники", "Подвеска", "Подшипники", "⚙️", 80000L, 72, 1.0),
            // Рулевое
            new ComponentTemplate("Рулевая рейка", "Рулевое управление", "Рулевой механизм", "⚙️", 150000L, 120, 0.7),
            new ComponentTemplate("Рулевые тяги", "Рулевое управление", "Рулевой механизм", "🔩", 100000L, 96, 1.0),
            new ComponentTemplate("Рулевые наконечники", "Рулевое управление", "Рулевой механизм", "🔧", 80000L, 72, 1.2),
            // Колёса
            new ComponentTemplate("Шины передние", "Колеса", "Шины", "⭕", 50000L, 48, 1.4),
            new ComponentTemplate("Шины задние", "Колеса", "Шины", "⭕", 50000L, 48, 1.2),
            new ComponentTemplate("Ступичные подшипники", "Колеса", "Подшипники", "⚙️", 100000L, 96, 0.9),
            // Прочее
            new ComponentTemplate("Аккумулятор (12В)", "Электрика", "Система питания", "🔋", 0L, 36, 1.0),
            new ComponentTemplate("Щётки стеклоочистителя", "Кузов", "Остекление", "🌧️", 0L, 12, 1.6),
            new ComponentTemplate("Салонный фильтр", "Салон", "Климат", "🌬️", 15000L, 12, 1.1),

            // ─── ШРУСы / приводы (зависит от привода, любой двигатель) ────────
            new ComponentTemplate("ШРУС наружный", "Подвеска", "Приводные валы", "⚙️", 100000L, 72, 1.0)
                    .drivetrains(Car.DrivetrainType.FWD, Car.DrivetrainType.AWD),
            new ComponentTemplate("ШРУС внутренний", "Подвеска", "Приводные валы", "⚙️", 100000L, 72, 0.9)
                    .drivetrains(Car.DrivetrainType.FWD, Car.DrivetrainType.AWD),
            new ComponentTemplate("Карданный вал", "Трансмиссия", "Приводные валы", "🔩", 150000L, 120, 0.6)
                    .drivetrains(Car.DrivetrainType.RWD, Car.DrivetrainType.AWD),
            new ComponentTemplate("Масло заднего редуктора", "Трансмиссия", "Редуктор", "🛢️", 80000L, 72, 0.8)
                    .drivetrains(Car.DrivetrainType.RWD, Car.DrivetrainType.AWD),
            new ComponentTemplate("Масло раздаточной коробки", "Трансмиссия", "Редуктор", "🛢️", 80000L, 72, 0.8)
                    .drivetrains(Car.DrivetrainType.AWD),

            // ─── ТОЛЬКО ДВС (бензин/дизель/гибрид) ───────────────────────────
            new ComponentTemplate("Масло двигателя", "Двигатель", "Система смазки", "🛢️", 10000L, 12, 1.2).ice(),
            new ComponentTemplate("Масляный фильтр", "Двигатель", "Система смазки", "🔧", 10000L, 12, 1.1).ice(),
            new ComponentTemplate("Воздушный фильтр", "Двигатель", "Система питания", "💨", 20000L, 24, 1.0).ice(),
            new ComponentTemplate("Топливный фильтр", "Двигатель", "Система питания", "⛽", 30000L, 24, 0.9).ice(),
            new ComponentTemplate("Топливный насос", "Двигатель", "Система питания", "🔌", 100000L, 96, 0.7).ice(),
            new ComponentTemplate("Форсунки", "Двигатель", "Система питания", "💉", 80000L, 72, 1.1).ice(),
            new ComponentTemplate("Ремень/цепь ГРМ", "Двигатель", "Газораспределительный механизм", "⚡", 100000L, 96, 1.0).ice(),
            new ComponentTemplate("Охлаждающая жидкость", "Двигатель", "Система охлаждения", "🌡️", 60000L, 36, 1.0).ice(),
            new ComponentTemplate("Радиатор", "Двигатель", "Система охлаждения", "❄️", 150000L, 120, 0.7).ice(),
            new ComponentTemplate("Помпа (водяной насос)", "Двигатель", "Система охлаждения", "💧", 100000L, 96, 0.9).ice(),
            new ComponentTemplate("Термостат", "Двигатель", "Система охлаждения", "🌡️", 80000L, 72, 0.8).ice(),
            new ComponentTemplate("Ремень генератора", "Двигатель", "Навесное оборудование", "⚡", 50000L, 48, 1.1).ice(),
            new ComponentTemplate("Генератор", "Двигатель", "Навесное оборудование", "🔋", 150000L, 120, 0.7).ice(),
            new ComponentTemplate("Стартер", "Двигатель", "Навесное оборудование", "🔌", 150000L, 120, 0.8).ice(),

            // ─── ТОЛЬКО БЕНЗИН ───────────────────────────────────────────────
            new ComponentTemplate("Свечи зажигания", "Двигатель", "Система зажигания", "⚡", 30000L, 36, 1.2)
                    .powertrains(Car.PowertrainType.PETROL),
            new ComponentTemplate("Катушки зажигания", "Двигатель", "Система зажигания", "🔌", 100000L, 96, 0.8)
                    .powertrains(Car.PowertrainType.PETROL),
            new ComponentTemplate("Высоковольтные провода", "Двигатель", "Система зажигания", "🔌", 80000L, 72, 0.9)
                    .powertrains(Car.PowertrainType.PETROL),

            // ─── ТОЛЬКО ДИЗЕЛЬ ───────────────────────────────────────────────
            new ComponentTemplate("Свечи накаливания", "Двигатель", "Система зажигания", "🔥", 60000L, 60, 0.9)
                    .powertrains(Car.PowertrainType.DIESEL),
            new ComponentTemplate("Сажевый фильтр (DPF)", "Двигатель", "Выпускная система", "🌫️", 120000L, 96, 0.8)
                    .powertrains(Car.PowertrainType.DIESEL),
            new ComponentTemplate("Жидкость AdBlue", "Двигатель", "Выпускная система", "💧", 15000L, 12, 1.2)
                    .powertrains(Car.PowertrainType.DIESEL),

            // ─── ЭЛЕКТРОПРИВОД (гибрид/электро) ──────────────────────────────
            new ComponentTemplate("Высоковольтная батарея", "Электропривод", "Тяговая батарея", "🔋", 300000L, 180, 0.4)
                    .powertrains(Car.PowertrainType.HYBRID, Car.PowertrainType.ELECTRIC),
            new ComponentTemplate("Инвертор", "Электропривод", "Силовая электроника", "⚡", 200000L, 150, 0.4)
                    .powertrains(Car.PowertrainType.HYBRID, Car.PowertrainType.ELECTRIC),
            new ComponentTemplate("Охлаждающая жидкость батареи", "Электропривод", "Система охлаждения", "🌡️", 90000L, 48, 0.7)
                    .powertrains(Car.PowertrainType.HYBRID, Car.PowertrainType.ELECTRIC),
            // ─── ТОЛЬКО ЭЛЕКТРО ──────────────────────────────────────────────
            new ComponentTemplate("Электродвигатель", "Электропривод", "Тяговый привод", "⚙️", 250000L, 180, 0.3)
                    .powertrains(Car.PowertrainType.ELECTRIC),
            new ComponentTemplate("Масло редуктора", "Трансмиссия", "Редуктор", "🛢️", 100000L, 96, 0.6)
                    .powertrains(Car.PowertrainType.ELECTRIC),

            // ─── ЗАВИСИТ ОТ КПП (только ДВС) ─────────────────────────────────
            new ComponentTemplate("Сцепление", "Трансмиссия", "Сцепление", "⚙️", 80000L, 96, 1.3)
                    .ice().transmissions(Car.TransmissionType.MANUAL),
            new ComponentTemplate("Выжимной подшипник", "Трансмиссия", "Сцепление", "⚙️", 100000L, 96, 1.0)
                    .ice().transmissions(Car.TransmissionType.MANUAL),
            new ComponentTemplate("Масло МКПП", "Трансмиссия", "Коробка передач", "🛢️", 60000L, 60, 1.0)
                    .ice().transmissions(Car.TransmissionType.MANUAL),
            new ComponentTemplate("Масло АКПП", "Трансмиссия", "Коробка передач", "🛢️", 60000L, 72, 1.0)
                    .ice().transmissions(Car.TransmissionType.AUTOMATIC)
        );

        boolean regenBrakes = pt == Car.PowertrainType.ELECTRIC || pt == Car.PowertrainType.HYBRID;

        for (ComponentTemplate template : templates) {
            if (!template.appliesTo(pt, tr, dr)) {
                continue;
            }

            double wearCoefficient = template.wearCoefficient;
            // Рекуперативное торможение снижает износ тормозных колодок/дисков
            if (regenBrakes && "Тормоза".equals(template.category) && "Тормозные механизмы".equals(template.subcategory)) {
                wearCoefficient *= 0.6;
            }

            CarComponent component = CarComponent.builder()
                    .car(car)
                    .name(template.name)
                    .category(template.category)
                    .subcategory(template.subcategory)
                    .icon(template.icon)
                    .maxMileage(template.maxMileage)
                    .maxMonths(template.maxMonths)
                    .wearCoefficient(wearCoefficient)
                    .currentMileage(0L)
                    .wearLevel(0)
                    .status(CarComponent.ComponentStatus.NEW)
                    .build();

            carComponentRepository.save(component);
        }

        // После создания компонентов сразу рассчитываем их износ на основе текущего пробега
        updateComponentWear(car);
    }

    
    @Transactional
    public void updateComponentWear(Car car) {
        List<CarComponent> components = carComponentRepository.findByCar(car);

        for (CarComponent component : components) {
            int previousWearLevel = component.getWearLevel();
            CarComponent.ComponentStatus previousStatus = component.getStatus();
            
            int wearLevel = calculateWearLevel(car, component);
            component.setWearLevel(wearLevel);

            // Обновление статуса на основе уровня износа
            if (wearLevel >= 90) {
                component.setStatus(CarComponent.ComponentStatus.CRITICAL);
            } else if (wearLevel >= 70) {
                component.setStatus(CarComponent.ComponentStatus.WARNING);
            } else if (wearLevel >= 50) {
                component.setStatus(CarComponent.ComponentStatus.NORMAL);
            } else {
                component.setStatus(CarComponent.ComponentStatus.NEW);
            }

            carComponentRepository.save(component);
            
            // Создание уведомлений при изменении статуса на критический или предупреждение
            if (wearLevel >= 90 && previousWearLevel < 90) {
                // Критический износ - создаем уведомление
                notificationService.createNotification(
                        car.getOwner().getId(),
                        "Критический износ детали",
                        String.format("Деталь '%s' требует срочной замены! Износ: %d%%", 
                                component.getName(), wearLevel),
                        kz.car.maintenance.model.Notification.NotificationType.COMPONENT_WEAR,
                        kz.car.maintenance.model.Notification.NotificationPriority.CRITICAL,
                        car
                );
            } else if (wearLevel >= 70 && previousWearLevel < 70 && previousStatus != CarComponent.ComponentStatus.WARNING) {
                // Предупреждение - создаем уведомление
                notificationService.createNotification(
                        car.getOwner().getId(),
                        "Требуется внимание к детали",
                        String.format("Деталь '%s' требует внимания. Износ: %d%%", 
                                component.getName(), wearLevel),
                        kz.car.maintenance.model.Notification.NotificationType.COMPONENT_WEAR,
                        kz.car.maintenance.model.Notification.NotificationPriority.HIGH,
                        car
                );
            }
        }
    }
    
    private int calculateWearLevel(Car car, CarComponent component) {
        if (component.getMaxMileage() == 0) {
            // Для компонентов без пробега (например, аккумулятор, дворники)
            // Расчет только по времени
            return calculateWearByTime(component);
        }
        
        // Пробег с момента последней замены (или с момента создания, если currentMileage = 0)
        long currentMileage = component.getCurrentMileage() != null ? component.getCurrentMileage() : 0;
        long mileageSinceReplacement = car.getMileage() - currentMileage;
        
        // Если пробег отрицательный (не должно быть, но на всякий случай)
        if (mileageSinceReplacement < 0) {
            mileageSinceReplacement = 0;
        }
        
        // Базовый расчет износа по пробегу
        double mileageWear = (double) mileageSinceReplacement / component.getMaxMileage() * 100;
        
        // Применение индивидуального коэффициента износа детали
        double wearCoefficient = component.getWearCoefficient() != null ? component.getWearCoefficient() : 1.0;
        mileageWear *= wearCoefficient;
        
        // Учет стиля вождения
        double drivingStyleMultiplier = getDrivingStyleMultiplier(car.getDrivingStyle());
        mileageWear *= drivingStyleMultiplier;
        
        // Учет времени
        int timeWear = calculateWearByTime(component);
        
        // Берем максимальное значение из пробега и времени
        return (int) Math.min(100, Math.max(mileageWear, timeWear));
    }
    
    private int calculateWearByTime(CarComponent component) {
        if (component.getLastReplacementDate() == null) {
            return 0;
        }
        
        long monthsSinceReplacement = java.time.temporal.ChronoUnit.MONTHS.between(
                component.getLastReplacementDate(), 
                java.time.LocalDate.now()
        );
        
        return (int) Math.min(100, (monthsSinceReplacement * 100.0 / component.getMaxMonths()));
    }
    
    private double getDrivingStyleMultiplier(Car.DrivingStyle style) {
        return switch (style) {
            case CALM -> 0.9;
            case MODERATE -> 1.0;
            case AGGRESSIVE -> 1.2;
        };
    }
    
    /**
     * Замена детали - сбрасывает износ и обновляет пробег
     */
    @Transactional
    public void replaceComponent(Long componentId, Long carId) {
        CarComponent component = carComponentRepository.findById(componentId)
                .orElseThrow(() -> new RuntimeException("Component not found"));
        
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new RuntimeException("Car not found"));
        
        // Проверка, что деталь принадлежит автомобилю
        if (!component.getCar().getId().equals(carId)) {
            throw new BadRequestException("Component does not belong to this car");
        }
        
        // Сброс износа и обновление пробега
        component.setWearLevel(0);
        component.setCurrentMileage(car.getMileage());
        component.setLastReplacementDate(LocalDate.now());
        component.setStatus(CarComponent.ComponentStatus.NEW);
        
        carComponentRepository.save(component);
    }
    
    /**
     * Исправление существующих компонентов - устанавливает currentMileage в 0 для правильного расчета износа
     * Используется для исправления компонентов, созданных до исправления бага
     */
    @Transactional
    public void fixExistingComponents(Car car) {
        List<CarComponent> components = carComponentRepository.findByCar(car);
        
        for (CarComponent component : components) {
            // Если currentMileage равен текущему пробегу, значит компонент был создан с багом
            // Устанавливаем currentMileage в 0 для правильного расчета износа
            if (component.getCurrentMileage() != null && 
                component.getCurrentMileage().equals(car.getMileage())) {
                component.setCurrentMileage(0L);
                carComponentRepository.save(component);
            }
        }
        
        // Пересчитываем износ после исправления
        updateComponentWear(car);
    }
    
    private static class ComponentTemplate {
        String name;
        String category;
        String subcategory;
        String icon;
        Long maxMileage;
        Integer maxMonths;
        Double wearCoefficient; // Коэффициент износа (0.1-2.0)

        // Применимость детали. По умолчанию — ко всем типам двигателя
        // и без ограничений по КПП/приводу (null = «для всех»).
        Set<Car.PowertrainType> powertrains = EnumSet.allOf(Car.PowertrainType.class);
        Set<Car.TransmissionType> transmissions = null;
        Set<Car.DrivetrainType> drivetrains = null;

        ComponentTemplate(String name, String category, String subcategory, String icon, Long maxMileage, Integer maxMonths, Double wearCoefficient) {
            this.name = name;
            this.category = category;
            this.subcategory = subcategory;
            this.icon = icon;
            this.maxMileage = maxMileage;
            this.maxMonths = maxMonths;
            this.wearCoefficient = wearCoefficient;
        }

        ComponentTemplate powertrains(Car.PowertrainType... values) {
            this.powertrains = EnumSet.copyOf(Arrays.asList(values));
            return this;
        }

        /** Деталь только для ДВС (бензин/дизель/гибрид). */
        ComponentTemplate ice() {
            this.powertrains = EnumSet.of(Car.PowertrainType.PETROL, Car.PowertrainType.DIESEL, Car.PowertrainType.HYBRID);
            return this;
        }

        ComponentTemplate transmissions(Car.TransmissionType... values) {
            this.transmissions = EnumSet.copyOf(Arrays.asList(values));
            return this;
        }

        ComponentTemplate drivetrains(Car.DrivetrainType... values) {
            this.drivetrains = EnumSet.copyOf(Arrays.asList(values));
            return this;
        }

        boolean appliesTo(Car.PowertrainType pt, Car.TransmissionType tr, Car.DrivetrainType dr) {
            if (!powertrains.contains(pt)) {
                return false;
            }
            if (transmissions != null && (tr == null || !transmissions.contains(tr))) {
                return false;
            }
            if (drivetrains != null && (dr == null || !drivetrains.contains(dr))) {
                return false;
            }
            return true;
        }
    }
}
