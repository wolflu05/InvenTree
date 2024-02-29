import { Stack } from '@mantine/core';

import { ObjectPanelBlock } from '.';
import {
  AngleInputGroup,
  BackgroundColorInputGroup,
  BorderStyleInputGroup,
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

export const StylePanelBlock: ObjectPanelBlock = () => {
  return (
    <Stack>
      <BackgroundColorInputGroup />
      <BorderStyleInputGroup />
    </Stack>
  );
};
