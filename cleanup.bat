@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(deps): move serverless-http to dependencies and add health check"
"%GIT%" push origin main
del cleanup.bat
