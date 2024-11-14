# 1. Node.js 공식 이미지를 기반으로 사용
FROM node:18-alpine

# 2. 애플리케이션 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. package.json과 package-lock.json을 복사하여 의존성 설치
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. 소스 파일을 컨테이너에 복사
COPY . .

# 6. TypeScript 파일을 빌드 (npm run build)
RUN npm run build

# 7. 포트 3000을 외부에 노출
EXPOSE 3000

# 8. 애플리케이션 실행
CMD ["node", "dist/apis.js"]  # 변경된 파일명에 맞게 수정
