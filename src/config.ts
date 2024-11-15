import dotenv from 'dotenv';

dotenv.config();

interface Config {
  package_id: string;
  platform_obj_id: string;
  testnet_endpoint: string;
  publisher_url: string;
  aggregator_url: string;
}

// 설정 정보를 가져오는 함수
const config: Config = {
  package_id: process.env.PACKAGE_ID || '0x42487c5b6ca8ee7c1b98c6a60e1a6315f08bba6b0cd38276147ef85b69b83048',
  platform_obj_id: process.env.PLATFORM_OBJ_ID || '0x308a516f13f7855bac7f991ad8a023565ed3098c43211a38a8c8d06fd3b5026b',
  testnet_endpoint: process.env.TESTNET_ENDPOINT || 'https://rpc-testnet.suiscan.xyz:443',
  publisher_url: process.env.PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  aggregator_url: process.env.AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
};

export default config;
