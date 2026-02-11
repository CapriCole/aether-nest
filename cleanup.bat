@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(db): copy database to /tmp for Vercel read-write access"
"%GIT%" push origin main
del cleanup.bat
