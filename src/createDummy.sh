#!/bin/bash

# 명령 실행 결과를 변수에 저장
output=$(sui client call --package 0x26613c1dda4b4e9ed7abb03f1b5a7b360fdfae94bc936f77039c94663970b933 --module suibond --function mint_foundation_cap --args foundation_name_01)

# 'Created Objects' 내에서 첫 번째 ObjectID만 추출
foundation_cap_obj_id=$(echo "$output" | sed -n '/Created Objects:/,/{/p' | grep -o '0x[0-9a-fA-F]\{40\}' | head -n 1)

# foundation_name_string은 그대로 foundation_name_01
foundation_name_string="foundation_name_01"

# platform_obj_id는 고정 값
platform_obj_id="0xf26d6d67c373894624d89b35933926cbe1948c83af9185753fb043aad1eb01ed"

# 'create_and_register_foundation' 명령어 실행
output_create_and_register=$(sui client call --package 0x26613c1dda4b4e9ed7abb03f1b5a7b360fdfae94bc936f77039c94663970b933 --module suibond --function create_and_register_foundation \
--args "$foundation_cap_obj_id" "$foundation_name_string" "$platform_obj_id")

# 'create_and_register_foundation' 명령어 실행 후 출력 결과 표시
echo "create_and_register_foundation 명령어 실행 결과:"
echo "$output_create_and_register"
echo "-----------------------------------------------------------"

# 명령 실행 후 출력 결과에서 'foundation::Foundation' ObjectType을 포함한 구간을 찾아 ObjectID 추출
foundation_object_id=$(echo "$output_create_and_register" | sed -n '/ObjectType:.*foundation::Foundation/{n;s/.*ObjectID: \([0-9a-fA-F]\{64\}\).*/\1/p}')

# 추출된 ObjectID 출력
echo "추출된 ObjectID: $foundation_object_id"
