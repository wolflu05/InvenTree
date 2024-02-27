import { Stack } from '@mantine/core';

import { ObjectPanelBlock } from '.';
import {
  AngleInputGroup,
  PositionInputGroup,
  SizeInputGroup
} from './_InputGroups';

export const LayoutPanelBlock: ObjectPanelBlock = () => {
  return (
    <Stack>
      <PositionInputGroup />
      <AngleInputGroup />
      <SizeInputGroup />
    </Stack>
  );
};
