@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "feat(db): auto-seed admin user on startup if missing"
"%GIT%" push origin main
del cleanup.bat
