@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(build): add postinstall script to rebuild native deps"
"%GIT%" push origin main
del cleanup.bat
