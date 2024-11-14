import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: "0xa7af992f31cd7ea6899413ec8231a9193e4c9f2507e98d79cf7ff716e1de2c12",
  platform_obj_id: "0x97d9b896dcb1aa7e1cb70572fad121c1853d6bb0bd6bc7850603582f0673a802",
  testnet_endpoint: "https://rpc-testnet.suiscan.xyz:443",
};

export default config;