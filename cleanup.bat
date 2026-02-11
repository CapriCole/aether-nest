@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(db): improve database path resolution for Vercel"
"%GIT%" push origin main
del cleanup.bat
