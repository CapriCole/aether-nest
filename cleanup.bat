@echo off
set "GIT=C:\Program Files\Git\cmd\git.exe"
"%GIT%" add .
"%GIT%" commit -m "fix(vercel): configure rewrites and serverless function"
"%GIT%" push origin main
