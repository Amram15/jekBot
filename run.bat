@echo off
set "GREEN=[32m"

echo %GREEN%Building Docker image...
docker build -t jek-bot .

echo %GREEN%Stopping existing container...
docker stop jek-bot-container

echo %GREEN%Removing existing container...
docker rm jek-bot-container

echo %GREEN%Running new container...
docker run -d --restart unless-stopped --name jek-bot-container jek-bot

echo %GREEN%Cleaning up Docker system...
docker system prune -a -f

echo %GREEN%Done!