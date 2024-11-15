import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: "0x5be6654cea5ff00eb402a28c6fd86e95208435e50c9689301d4da1be08e87f5e",
  platform_obj_id: "0xa3b60233ae8bf0a350418b89dff7cc312257681d22ab4be2dd8613cdacf2c831",
  testnet_endpoint: "https://rpc-testnet.suiscan.xyz:443",
};

export default config;