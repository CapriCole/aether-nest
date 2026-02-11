@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(vercel): remove legacy path property from functions config"
"%GIT%" push origin main
del cleanup.bat
