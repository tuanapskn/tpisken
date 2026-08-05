# Tpisken

Bu proje Migros'ta DevOps stajyeri iken geliştirilmiş küçük bir örnek uygulamadır. Backend (Flask) ve frontend (statik HTML/JS) parçalarından oluşur; Docker, Docker Compose ve Kubernetes dağıtımı için örnek konfigürasyonları içerir.

## İçindekiler

- Proje yapısı
- Gereksinimler
- Lokal çalıştırma (Docker Compose)
- Docker görüntüleri ve Kubernetes
- CI/CD (Azure Pipelines)
- GitHub'a yükleme

## Proje yapısı

- `backend/` — Flask uygulaması, `app.py`, `requirements.txt`, `Dockerfile`
- `frontend/` — statik frontend dosyaları (`index.html`, `script.js`, `style.css`) ve `Dockerfile`
- `docker-compose.yml` — lokal olarak backend+frontend çalıştırmak için
- `k8s-backend-deployment.yaml`, `k8s-frontend-deployment.yaml` — örnek Kubernetes manifestleri
- `azure-pipelines.yml` — örnek CI pipeline

## Gereksinimler

- Docker
- Docker Compose
- Python 3.8+ (yalnızca backend'i doğrudan çalıştırmak isterseniz)
- (Kubernetes için) `kubectl` ve bir k8s kümesi (minikube, kind veya uzak küme)

## Lokal olarak çalıştırma (Docker Compose)

En kolay yol Docker Compose ile çalıştırmaktır:

```bash
docker-compose up --build
```

Bu komut backend ve frontend servislerini oluşturup başlatacaktır. Tarayıcıdan http://localhost:5000 veya kompozisyona göre belirlenmiş portu kontrol edin.

## Backend'i doğrudan çalıştırma

1. Sanal ortam oluşturun ve aktivite edin:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Uygulama varsayılan olarak `5000` portunda çalışacaktır.

## Docker görüntüleri

Elle görüntü oluşturup test etmek isterseniz:

```bash
docker build -t yourname/tpisken-backend:latest ./backend
docker build -t yourname/tpisken-frontend:latest ./frontend
```

Görüntüleri bir container registry'ye (Docker Hub, ACR, ECR vb.) itebilirsiniz.

## Kubernetes ile dağıtım

Hazır manifestler mevcut. Kendi registry ayarlarınızı ve image isimlerinizi güncelleyin, sonra uygulayın:

```bash
kubectl apply -f k8s-backend-deployment.yaml
kubectl apply -f k8s-frontend-deployment.yaml
```

Servis ve Ingress yapılandırmanızı küme ortamınıza göre uyarlayın.

## CI/CD

Bu repo `azure-pipelines.yml` içermektedir; Azure DevOps ile pipeline kurulumuna örnek teşkil eder. Pipeline içinde image build, test ve registry'ye push adımlarını ekleyebilirsiniz.

## GitHub'a yükleme

Yerel repoyu GitHub'a göndermek için örnek adımlar:

```bash
git init
git add .
git commit -m "İlk commit: Tpisken proje dosyaları"
# GitHub'da yeni bir repo oluşturduktan sonra uzak adresi ekleyin:
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

`USERNAME` ve `REPO_NAME` alanlarını kendi hesabınıza göre güncelleyin.

## Lisans

Bu projeyi paylaşırken `MIT` lisansını kullanabilirsiniz — isterseniz lisans dosyası ekleyin veya farklı bir lisans seçin.

## İletişim

Projeyle ilgili sorular için lütfen README içindeki bilgileri veya doğrudan proje sahibine başvurun (ilgili e-posta/isim bilgilerini buraya ekleyin).
