@echo off
echo Setting up Library Management Database...
echo.
echo Please enter your PostgreSQL password when prompted.
echo.

REM Create database
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE library_management;"

echo.
echo Database created! Now setting up schema...
echo.

REM Run schema migration
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d library_management -f backend\migrations\001_schema.sql

echo.
echo Schema created! Now loading sample data...
echo.

REM Load sample data
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d library_management -f backend\migrations\002_seed.sql

echo.
echo Database setup complete!
echo.
pause