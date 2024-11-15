import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: "0x42487c5b6ca8ee7c1b98c6a60e1a6315f08bba6b0cd38276147ef85b69b83048",
  platform_obj_id: "0x308a516f13f7855bac7f991ad8a023565ed3098c43211a38a8c8d06fd3b5026b",
  testnet_endpoint: "https://rpc-testnet.suiscan.xyz:443",
};

export default config;