import { Flex, Text } from "@chakra-ui/react";
import { FileUploaded } from "@interfaces/Answer";
import { memo } from "react";
import FileItem from "../FileItem";
import { FieldTypes, IField } from "@interfaces/FormDraft";
import { convertDateTime } from "@utils/date";

const RenderFieldValue = memo(({ field }: { field: IField }) => {
  if (!field) {
    return null;
  }

  const { label = "", value = "", type } = field;

  if (
    type === FieldTypes.textarea ||
    type === FieldTypes.text ||
    value === ""
  ) {
    <Flex direction={"column"}>
      <Text fontSize="sm" mr={2}>
        {label}:
      </Text>
      <Text fontSize="sm" fontWeight={"bold"}>
        {/* @ts-ignore */}
        {value ?? "N/A"}
      </Text>
    </Flex>;
  }

  if (type === FieldTypes.file) {
    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        <FileItem file={value as FileUploaded} />
      </Flex>
    );
  }

  // if (type === FieldTypes.teachers) {
  //   if (Array.isArray(value)) {
  //     return value.map((el) => (
  //       <Flex direction={"column"} key={el.id}>
  //         <Text fontSize="sm" mr={2} mb={2}>
  //           {label}:
  //         </Text>
  //         <UserDetails user={el} />
  //       </Flex>
  //     ));
  //   }

  //   return (
  //     <Flex direction={"column"}>
  //       <Text fontSize="sm" mr={2} mb={2}>
  //         {label}:
  //       </Text>
  //       {/* @ts-ignore */}
  //       <UserDetails user={value} />
  //     </Flex>
  //   );
  // }

  if (type === FieldTypes.checkbox && Array.isArray(value)) {
    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        {value
          .map(
            (el) =>
              // @ts-ignore
              field?.options?.find((option) => option?.value === el)?.label
          )
          .join(", ")}
      </Flex>
    );
  }

  if (type === FieldTypes.radio) {
    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        {/* @ts-ignore */}
        {field?.options?.find((option) => option?.value === value)?.label}
      </Flex>
    );
  }

  if (type === FieldTypes.select) {
    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        {/* @ts-ignore */}
        {field?.options?.find((option) => option?.value === value)?.label}
      </Flex>
    );
  }

  if (type === FieldTypes.multiselect) {
    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        {/* @ts-ignore */}
        {value?.map?.(
            // @ts-ignore
            (el) =>
              // @ts-ignore
              field?.options?.find((option) => option?.value === el)?.label
          )
          .join(", ")}
      </Flex>
    );
  }

  if (type === FieldTypes.date) {
    return (
      <Flex direction={"column"}>
        <Text fontSize="sm" mr={2}>
          {label}:
        </Text>
        <Text fontSize="sm" fontWeight={"bold"}>
          {/* @ts-ignore */}
          {convertDateTime(value,
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            },
            "UTC"
          )}
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction={"column"}>
      <Text fontSize="sm" mr={2}>
        {label}:
      </Text>
      <Text fontSize="sm" fontWeight={"bold"}>
        {/* @ts-ignore */}
        {value}
      </Text>
    </Flex>
  );
});

export default RenderFieldValue;
