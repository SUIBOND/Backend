import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: "0xd41317eeb1dbb1be8d818f8505fa674cb99debe112f0e221e2e9194227bd2cbf",
  platform_obj_id: "0xcd7a780e7848ae205218cf58dc089b395efe3650a150905525eec620ca661a45",
  testnet_endpoint: "https://rpc-testnet.suiscan.xyz:443",
};

export default config;