FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY FinTrak.sln .
COPY FinTrak.Core/ FinTrak.Core/
COPY FinTrak.Infrastructure/ FinTrak.Infrastructure/
COPY FinTrak.Api/ FinTrak.Api/
RUN dotnet restore FinTrak.Api/FinTrak.Api.csproj
RUN dotnet publish FinTrak.Api/FinTrak.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "FinTrak.Api.dll"]
