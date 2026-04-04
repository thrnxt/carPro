@echo off
REM Скрипт для быстрого запуска backend приложения (Windows)

echo 🚗 Car Maintenance Platform - Backend Startup
echo ==============================================
echo.

REM Проверка Java
echo 📋 Проверка Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java не установлена. Пожалуйста, установите Java 17+
    pause
    exit /b 1
)
echo ✅ Java установлена
java -version

REM Проверка Maven
echo.
echo 📋 Проверка Maven...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Maven не установлен. Пожалуйста, установите Maven 3.6+
    pause
    exit /b 1
)
echo ✅ Maven установлен
mvn -version | findstr /C:"Apache Maven"

REM Проверка PostgreSQL
echo.
echo 📋 Проверка PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL не найден в PATH. Убедитесь, что PostgreSQL установлен.
) else (
    echo ✅ PostgreSQL найден
    psql --version
)

REM Создание директории для загрузок
echo.
echo 📋 Создание директорий...
if not exist "uploads" mkdir uploads
echo ✅ Директории созданы

REM Сборка проекта
echo.
echo 🔨 Сборка проекта...
call mvn clean install -DskipTests
if errorlevel 1 (
    echo ❌ Ошибка при сборке проекта
    pause
    exit /b 1
)
echo ✅ Проект собран успешно

REM Запуск приложения
echo.
echo 🚀 Запуск приложения...
echo    API будет доступен на: http://localhost:8080/api
echo    Нажмите Ctrl+C для остановки
echo.
call mvn spring-boot:run

pause
