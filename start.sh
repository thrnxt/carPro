#!/bin/bash

# Скрипт для быстрого запуска backend приложения

echo "🚗 Car Maintenance Platform - Backend Startup"
echo "=============================================="
echo ""

# Проверка Java
echo "📋 Проверка Java..."
if ! command -v java &> /dev/null; then
    echo "❌ Java не установлена. Пожалуйста, установите Java 17+"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Требуется Java 17+, найдена Java $JAVA_VERSION"
    exit 1
fi
echo "✅ Java установлена: $(java -version 2>&1 | head -n 1)"

# Проверка Maven
echo "📋 Проверка Maven..."
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven не установлен. Пожалуйста, установите Maven 3.6+"
    exit 1
fi
echo "✅ Maven установлен: $(mvn -version | head -n 1)"

# Проверка PostgreSQL
echo "📋 Проверка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL не найден в PATH. Убедитесь, что PostgreSQL установлен."
else
    echo "✅ PostgreSQL найден: $(psql --version)"
fi

# Проверка подключения к базе данных
echo "📋 Проверка подключения к базе данных..."
PGPASSWORD=postgres psql -U postgres -d car_maintenance_db -c "SELECT 1;" &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Подключение к базе данных успешно"
else
    echo "⚠️  Не удалось подключиться к базе данных"
    echo "   Убедитесь, что:"
    echo "   1. PostgreSQL запущен"
    echo "   2. База данных 'car_maintenance_db' создана"
    echo "   3. Пользователь 'postgres' с паролем 'postgres' существует"
    echo ""
    read -p "Продолжить запуск? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Создание директории для загрузок
echo "📋 Создание директорий..."
mkdir -p uploads
echo "✅ Директории созданы"

# Сборка проекта
echo ""
echo "🔨 Сборка проекта..."
mvn clean install -DskipTests
if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке проекта"
    exit 1
fi
echo "✅ Проект собран успешно"

# Запуск приложения
echo ""
echo "🚀 Запуск приложения..."
echo "   API будет доступен на: http://localhost:8080/api"
echo "   Нажмите Ctrl+C для остановки"
echo ""
mvn spring-boot:run
