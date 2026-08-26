@echo off
echo Building React frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo Error building React frontend
    exit /b %errorlevel%
)

echo Copying built files to Django static directory...
cd ..
xcopy frontend\build\* Sante_Virtuelle\sante_app\static\frontend\ /E /Y /I

echo Frontend deployment completed successfully!