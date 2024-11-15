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
  package_id: '0x922d74ee216861856fc88acf96c039658777056cad3f712e79346014a26bfaea',
  platform_obj_id: '0xa39d4371517fee9b4677e16abb7d0369de4f75f92679e710e60f9f679125149a',
  testnet_endpoint: process.env.TESTNET_ENDPOINT || 'https://rpc-testnet.suiscan.xyz:443',
  publisher_url: process.env.PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  aggregator_url: process.env.AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
};

export default config;
