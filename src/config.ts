import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: "0x3bcc073d35853af2948186e720af074309e29d5f9fa85a334d060c28c7472129",
  platform_obj_id: "0xc181d914ad030e3ce12b83b53b7ee4df02092866152273f030bf8ddb3c4d6836",
  testnet_endpoint: "https://rpc-testnet.suiscan.xyz:443",
};

export default config;