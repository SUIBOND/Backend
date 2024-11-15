import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: "0x00ddf376f278328c1c40014223e3a07953f6d48aef026cb14ca5e7a24b2eb914",
  platform_obj_id: "0x7b217f5be67d22704cf0278a309233aa0edd0cce5fbbf4c717cd64967d7da00f",
  testnet_endpoint: "https://rpc-testnet.suiscan.xyz:443",
};

export default config;