@echo off
cd /d "%~dp0"
echo 找番库本地服务: http://localhost:8792
py -m http.server 8792 --bind 127.0.0.1 || python -m http.server 8792 --bind 127.0.0.1
