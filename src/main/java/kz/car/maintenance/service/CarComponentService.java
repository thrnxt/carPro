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
import java.util.List;

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
        // Расширенный список компонентов с иконками, подкатегориями и коэффициентами износа
        // Коэффициент износа: 0.1-0.5 (медленный износ), 0.6-1.0 (нормальный), 1.1-1.5 (быстрый), 1.6-2.0 (очень быстрый)
        List<ComponentTemplate> templates = Arrays.asList(
            // ДВИГАТЕЛЬ - Система смазки
            new ComponentTemplate("Масло двигателя", "Двигатель", "Система смазки", "🛢️", 10000L, 12, 1.2),
            new ComponentTemplate("Масляный фильтр", "Двигатель", "Система смазки", "🔧", 10000L, 12, 1.1),
            new ComponentTemplate("Масляный насос", "Двигатель", "Система смазки", "⚙️", 150000L, 120, 0.8),
            
            // ДВИГАТЕЛЬ - Система питания
            new ComponentTemplate("Воздушный фильтр", "Двигатель", "Система питания", "💨", 20000L, 24, 1.0),
            new ComponentTemplate("Топливный фильтр", "Двигатель", "Система питания", "⛽", 30000L, 24, 0.9),
            new ComponentTemplate("Топливный насос", "Двигатель", "Система питания", "🔌", 100000L, 96, 0.7),
            new ComponentTemplate("Форсунки", "Двигатель", "Система питания", "💉", 80000L, 72, 1.1),
            
            // ДВИГАТЕЛЬ - Кривошипно-шатунный механизм
            new ComponentTemplate("Коленчатый вал", "Двигатель", "Кривошипно-шатунный механизм", "⚙️", 200000L, 180, 0.5),
            new ComponentTemplate("Шатуны", "Двигатель", "Кривошипно-шатунный механизм", "🔩", 200000L, 180, 0.5),
            new ComponentTemplate("Поршни", "Двигатель", "Кривошипно-шатунный механизм", "🔩", 150000L, 120, 0.6),
            new ComponentTemplate("Поршневые кольца", "Двигатель", "Кривошипно-шатунный механизм", "⭕", 100000L, 96, 1.3),
            new ComponentTemplate("Вкладыши коленвала", "Двигатель", "Кривошипно-шатунный механизм", "🔩", 150000L, 120, 0.7),
            
            // ДВИГАТЕЛЬ - Газораспределительный механизм
            new ComponentTemplate("Ремень ГРМ", "Двигатель", "Газораспределительный механизм", "⚡", 60000L, 60, 1.4),
            new ComponentTemplate("Цепь ГРМ", "Двигатель", "Газораспределительный механизм", "⛓️", 150000L, 120, 0.6),
            new ComponentTemplate("Распределительный вал", "Двигатель", "Газораспределительный механизм", "⚙️", 200000L, 180, 0.5),
            new ComponentTemplate("Клапаны", "Двигатель", "Газораспределительный механизм", "🔧", 100000L, 96, 0.9),
            new ComponentTemplate("Рокеры", "Двигатель", "Газораспределительный механизм", "🔩", 150000L, 120, 0.8),
            
            // ДВИГАТЕЛЬ - Система охлаждения
            new ComponentTemplate("Охлаждающая жидкость", "Двигатель", "Система охлаждения", "🌡️", 60000L, 36, 1.0),
            new ComponentTemplate("Радиатор", "Двигатель", "Система охлаждения", "❄️", 150000L, 120, 0.7),
            new ComponentTemplate("Помпа (водяной насос)", "Двигатель", "Система охлаждения", "💧", 100000L, 96, 0.9),
            new ComponentTemplate("Термостат", "Двигатель", "Система охлаждения", "🌡️", 80000L, 72, 0.8),
            
            // ДВИГАТЕЛЬ - Система зажигания
            new ComponentTemplate("Свечи зажигания", "Двигатель", "Система зажигания", "⚡", 30000L, 36, 1.2),
            new ComponentTemplate("Катушки зажигания", "Двигатель", "Система зажигания", "🔌", 100000L, 96, 0.8),
            new ComponentTemplate("Высоковольтные провода", "Двигатель", "Система зажигания", "🔌", 80000L, 72, 0.9),
            
            // ДВИГАТЕЛЬ - Навесное оборудование
            new ComponentTemplate("Ремень генератора", "Двигатель", "Навесное оборудование", "⚡", 50000L, 48, 1.1),
            new ComponentTemplate("Генератор", "Двигатель", "Навесное оборудование", "🔋", 150000L, 120, 0.7),
            new ComponentTemplate("Стартер", "Двигатель", "Навесное оборудование", "🔌", 150000L, 120, 0.8),
            
            // ТОРМОЗА
            new ComponentTemplate("Тормозные колодки передние", "Тормоза", "Тормозные механизмы", "🛑", 40000L, 36, 1.5),
            new ComponentTemplate("Тормозные колодки задние", "Тормоза", "Тормозные механизмы", "🛑", 50000L, 48, 1.3),
            new ComponentTemplate("Тормозные диски передние", "Тормоза", "Тормозные механизмы", "⭕", 60000L, 60, 1.2),
            new ComponentTemplate("Тормозные диски задние", "Тормоза", "Тормозные механизмы", "⭕", 80000L, 72, 1.0),
            new ComponentTemplate("Тормозные барабаны", "Тормоза", "Тормозные механизмы", "⭕", 100000L, 96, 0.9),
            new ComponentTemplate("Тормозная жидкость", "Тормоза", "Гидравлическая система", "💧", 60000L, 24, 1.0),
            new ComponentTemplate("Тормозные шланги", "Тормоза", "Гидравлическая система", "🔧", 100000L, 96, 0.8),
            new ComponentTemplate("Главный тормозной цилиндр", "Тормоза", "Гидравлическая система", "🔩", 150000L, 120, 0.6),
            new ComponentTemplate("Вакуумный усилитель", "Тормоза", "Гидравлическая система", "⚙️", 200000L, 180, 0.5),
            
            // ПОДВЕСКА
            new ComponentTemplate("Амортизаторы передние", "Подвеска", "Амортизаторы", "🔧", 80000L, 60, 1.1),
            new ComponentTemplate("Амортизаторы задние", "Подвеска", "Амортизаторы", "🔧", 80000L, 60, 1.0),
            new ComponentTemplate("Пружины передние", "Подвеска", "Амортизаторы", "🌀", 150000L, 120, 0.6),
            new ComponentTemplate("Пружины задние", "Подвеска", "Амортизаторы", "🌀", 150000L, 120, 0.6),
            new ComponentTemplate("Стойки стабилизатора", "Подвеска", "Стабилизаторы", "🔩", 60000L, 48, 1.2),
            new ComponentTemplate("Стабилизатор поперечной устойчивости", "Подвеска", "Стабилизаторы", "⚙️", 100000L, 96, 0.7),
            new ComponentTemplate("ШРУС наружный", "Подвеска", "Приводные валы", "⚙️", 100000L, 72, 1.0),
            new ComponentTemplate("ШРУС внутренний", "Подвеска", "Приводные валы", "⚙️", 100000L, 72, 0.9),
            new ComponentTemplate("Приводной вал", "Подвеска", "Приводные валы", "🔩", 150000L, 120, 0.7),
            new ComponentTemplate("Сайлентблоки", "Подвеска", "Резинотехнические изделия", "🔧", 80000L, 72, 1.1),
            new ComponentTemplate("Шаровые опоры", "Подвеска", "Шарниры", "⚙️", 100000L, 96, 1.0),
            new ComponentTemplate("Рычаги подвески", "Подвеска", "Рычаги", "🔩", 150000L, 120, 0.6),
            new ComponentTemplate("Опорные подшипники", "Подвеска", "Подшипники", "⚙️", 80000L, 72, 1.0),
            
            // РУЛЕВОЕ УПРАВЛЕНИЕ
            new ComponentTemplate("Рулевая рейка", "Рулевое управление", "Рулевой механизм", "⚙️", 150000L, 120, 0.7),
            new ComponentTemplate("Рулевые тяги", "Рулевое управление", "Рулевой механизм", "🔩", 100000L, 96, 1.0),
            new ComponentTemplate("Рулевые наконечники", "Рулевое управление", "Рулевой механизм", "🔧", 80000L, 72, 1.2),
            new ComponentTemplate("Рулевая колонка", "Рулевое управление", "Рулевой механизм", "⚙️", 200000L, 180, 0.5),
            new ComponentTemplate("Рулевая жидкость", "Рулевое управление", "Гидроусилитель", "💧", 60000L, 36, 1.0),
            new ComponentTemplate("Насос ГУР", "Рулевое управление", "Гидроусилитель", "⚙️", 150000L, 120, 0.7),
            
            // ТРАНСМИССИЯ
            new ComponentTemplate("Сцепление", "Трансмиссия", "Сцепление", "⚙️", 80000L, 96, 1.3),
            new ComponentTemplate("Выжимной подшипник", "Трансмиссия", "Сцепление", "⚙️", 100000L, 96, 1.0),
            new ComponentTemplate("Корзина сцепления", "Трансмиссия", "Сцепление", "🔩", 150000L, 120, 0.8),
            new ComponentTemplate("Масло КПП", "Трансмиссия", "Коробка передач", "🛢️", 60000L, 60, 1.0),
            new ComponentTemplate("Синхронизаторы", "Трансмиссия", "Коробка передач", "⚙️", 150000L, 120, 0.7),
            
            // ЭЛЕКТРИКА
            new ComponentTemplate("Аккумулятор", "Электрика", "Система питания", "🔋", 0L, 36, 1.0),
            new ComponentTemplate("Альтернатор", "Электрика", "Система питания", "⚡", 150000L, 120, 0.7),
            new ComponentTemplate("Реле", "Электрика", "Система управления", "🔌", 100000L, 96, 0.5),
            new ComponentTemplate("Предохранители", "Электрика", "Система защиты", "🔧", 0L, 24, 0.3),
            new ComponentTemplate("Проводка", "Электрика", "Система управления", "🔌", 200000L, 180, 0.4),
            
            // КУЗОВ
            new ComponentTemplate("Дворники передние", "Кузов", "Остекление", "🌧️", 0L, 12, 1.5),
            new ComponentTemplate("Дворники задние", "Кузов", "Остекление", "🌧️", 0L, 12, 1.3),
            new ComponentTemplate("Щетки стеклоочистителя", "Кузов", "Остекление", "🌧️", 0L, 12, 1.6),
            new ComponentTemplate("Фары", "Кузов", "Освещение", "💡", 0L, 60, 0.5),
            new ComponentTemplate("Поворотники", "Кузов", "Освещение", "💡", 0L, 60, 0.4),
            new ComponentTemplate("Стоп-сигналы", "Кузов", "Освещение", "💡", 0L, 60, 0.4),
            
            // КОЛЕСА
            new ComponentTemplate("Шины передние", "Колеса", "Шины", "⭕", 50000L, 48, 1.4),
            new ComponentTemplate("Шины задние", "Колеса", "Шины", "⭕", 50000L, 48, 1.2),
            new ComponentTemplate("Диски", "Колеса", "Диски", "⭕", 200000L, 180, 0.3),
            new ComponentTemplate("Ступичные подшипники", "Колеса", "Подшипники", "⚙️", 100000L, 96, 0.9)
        );
        
        for (ComponentTemplate template : templates) {
            CarComponent component = CarComponent.builder()
                    .car(car)
                    .name(template.name)
                    .category(template.category)
                    .subcategory(template.subcategory)
                    .icon(template.icon)
                    .maxMileage(template.maxMileage)
                    .maxMonths(template.maxMonths)
                    .wearCoefficient(template.wearCoefficient)
                    .currentMileage(0L) // Устанавливаем 0, чтобы износ рассчитывался от текущего пробега автомобиля
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
        
        ComponentTemplate(String name, String category, String subcategory, String icon, Long maxMileage, Integer maxMonths, Double wearCoefficient) {
            this.name = name;
            this.category = category;
            this.subcategory = subcategory;
            this.icon = icon;
            this.maxMileage = maxMileage;
            this.maxMonths = maxMonths;
            this.wearCoefficient = wearCoefficient;
        }
    }
}
