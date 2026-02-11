@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(vercel): correct includeFiles format to string"
"%GIT%" push origin main
del cleanup.bat
