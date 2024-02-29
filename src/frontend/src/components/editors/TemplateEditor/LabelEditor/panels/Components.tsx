import { t } from '@lingui/macro';
import {
  Checkbox,
  ColorInput,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core';
import { IconCheck, TablerIconsProps } from '@tabler/icons-react';
import { useCallback, useState } from 'react';

import { PageSettingsType, useLabelEditorStore } from '../LabelEditorContext';
import { convertUnit, units } from '../utils';

const getInputTemplates = (
  pageSettings: PageSettingsType
): Record<string, InputGroupInputProps> => ({
  unit: {
    key: '',
    label: t`Unit`,
    type: 'select',
    defaultValue: pageSettings.unit['length.unit'],
    selectOptions: Object.entries(units).map(([key, value]) => ({
      value: key,
      label: value.name
    }))
  }
});

type InputGroupInputProps = {
  key: string;
  disabled?: boolean;
} & {
  label?: string;
  type?:
    | 'number'
    | 'switch'
    | 'checkbox'
    | 'select'
    | 'text'
    | 'color'
    | 'radio';
  icon?: (props: TablerIconsProps) => JSX.Element;
  tooltip?: string;
  defaultValue?: number | boolean | string;
  selectOptions?: { value: string; label: string }[];
  radioOptions?: {
    value: string;
    label?: string;
    icon?: (props: TablerIconsProps) => JSX.Element;
  }[];
  template?: 'unit';
};

type InputGroupRow = {
  key: string;
  columns: InputGroupInputProps[];
};

/**
 * updateCanvas - updates the canvas with the new values (by default its called by onBlur if onBlur is not defined)
 */
export type UseInputGroupProps<T extends any[]> = {
  name: string;
  icon: (props: TablerIconsProps) => JSX.Element;
  inputRows: InputGroupRow[];
  onChange?: (key: string, value: any, allValues: Record<string, any>) => void;
  onBlur?: (
    key: string,
    value: any,
    allValues: Record<string, any>,
    oldState: Record<string, any>,
    state: UseInputGroupStateReturnType<T>
  ) => void;
  updateCanvas?: (values: Record<string, any>) => void;
  updateInputs?: (...args: T) => void;
};

type UseInputGroupStateReturnType<T extends any[]> = UseInputGroupProps<T> & {
  value: Record<string, any>;
  setValue: (key: string, value: any, trigger?: boolean) => void;
  triggerUpdate: (...args: T) => void;
};

export const useInputGroupState = <T extends any[]>(
  props: UseInputGroupProps<T>
): UseInputGroupStateReturnType<T> => {
  const { inputRows, onChange } = props;
  const labelEditorStore = useLabelEditorStore();

  const [state, setState] = useState(() => {
    const _state: Record<string, any> = {};
    inputRows.forEach((row) => {
      row.columns.forEach((_input) => {
        let input = _input;
        if (input.template) {
          input = {
            ...getInputTemplates(labelEditorStore.getState().pageSettings)[
              input.template
            ],
            ..._input
          };
        }
        _state[`${row.key}.${input.key}`] = input.defaultValue;
      });
    });
    return _state;
  });

  const setValue = useCallback(
    (key: string, value: any, trigger: boolean = false) => {
      setState((state) => {
        const newState = { ...state, [key]: value };
        if (trigger) {
          onChange?.(key, value, newState);
        }
        return newState;
      });
    },
    [onChange]
  );

  const onBlur = useCallback(
    (
      key: string,
      value: any,
      allValues: Record<string, any>,
      oldState: Record<string, any>,
      state: UseInputGroupStateReturnType<T>
    ) => {
      if (props.onBlur) {
        props.onBlur(key, value, allValues, oldState, state);
      } else {
        props.updateCanvas?.(allValues);
      }
    },
    [props.onBlur, props.updateCanvas]
  );

  const triggerUpdate = useCallback(
    (...args: T) => {
      props.updateInputs?.(...args);
    },
    [props.updateInputs]
  );

  return {
    ...props,
    value: state,
    setValue,
    onBlur,
    triggerUpdate
  };
};

type InputGroupProps<T extends any[]> = Omit<
  UseInputGroupProps<T>,
  'onChange'
> & {
  value: Record<string, any>;
  setValue: (key: string, value: any, trigger: boolean) => void;
};

export const InputGroup = <T extends any[]>({
  state
}: {
  state: UseInputGroupStateReturnType<T>;
}) => {
  const { name, icon: Icon, inputRows, value, setValue: _setValue } = state;
  const setValue = useCallback(
    (key: string, value: any) => {
      _setValue(key, value, true);
    },
    [_setValue]
  );
  const labelEditorStore = useLabelEditorStore();

  return (
    <Stack style={{ gap: 0 }}>
      <Group noWrap>
        <Icon size="1.25rem" />
        <Title order={5} ml={'-10px'} weight={500}>
          {name}
        </Title>
      </Group>
      {inputRows.map((row, rowIdx) => (
        <Group key={rowIdx} noWrap style={{ gap: '4px' }}>
          {row.columns.map((_input, idx) => {
            let input = _input;
            if (input.template) {
              input = {
                ...getInputTemplates(labelEditorStore.getState().pageSettings)[
                  input.template
                ],
                ..._input
              };
            }
            const key = `${row.key}.${input.key}`;

            if (input.type === 'text') {
              return (
                <TextInput
                  key={idx}
                  size="xs"
                  disabled={input.disabled}
                  label={input.label}
                  value={value[key]}
                  onChange={(e) => setValue(key, e.currentTarget.value)}
                  onBlur={() =>
                    state.onBlur?.(key, value[key], value, value, state)
                  }
                />
              );
            }

            if (input.type === 'number') {
              return (
                <NumberInput
                  key={idx}
                  size="xs"
                  disabled={input.disabled}
                  label={input.label}
                  value={value[key]}
                  onChange={(value) => setValue(key, value)}
                  onClick={() => console.log('T')}
                  onBlur={() =>
                    state.onBlur?.(key, value[key], value, value, state)
                  }
                  precision={10}
                  formatter={(value) => {
                    const v = parseFloat(value);

                    if (Number.isNaN(v) || !Number.isFinite(v)) {
                      return value;
                    }

                    return `${v}`;
                  }}
                  stepHoldDelay={500}
                  stepHoldInterval={100}
                  rightSectionProps={{
                    onClick: () =>
                      state.onBlur?.(key, value[key], value, value, state)
                  }}
                />
              );
            }

            if (input.type === 'switch') {
              return (
                <Switch
                  key={idx}
                  label={input.label}
                  disabled={input.disabled}
                  mt={5}
                  checked={value[key]}
                  onChange={(e) => {
                    setValue(key, e.currentTarget.checked);
                    const newValue = {
                      ...value,
                      [key]: e.currentTarget.checked
                    };
                    state.onBlur?.(
                      key,
                      e.currentTarget.checked,
                      newValue,
                      value,
                      state
                    );
                  }}
                />
              );
            }

            if (input.type === 'checkbox') {
              const showTooltip = !!input.tooltip;
              return (
                <Tooltip
                  label={input.tooltip}
                  events={{
                    hover: showTooltip,
                    focus: showTooltip,
                    touch: showTooltip
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Checkbox
                    mt={10}
                    mr={8}
                    style={{ alignSelf: 'flex-end' }}
                    styles={{
                      label: { fontSize: '0.875rem', cursor: 'pointer' },
                      input: { cursor: 'pointer' }
                    }}
                    key={idx}
                    icon={({ className }) =>
                      input.icon ? (
                        <input.icon className={className} />
                      ) : (
                        <IconCheck className={className} />
                      )
                    }
                    disabled={input.disabled}
                    label={input.label ? input.label : undefined}
                    indeterminate={input.icon ? !value[key] : false}
                    checked={value[key]}
                    onChange={(e) => {
                      setValue(key, e.currentTarget.checked);
                      const newValue = {
                        ...value,
                        [key]: e.currentTarget.checked
                      };
                      state.onBlur?.(
                        key,
                        e.currentTarget.checked,
                        newValue,
                        value,
                        state
                      );
                    }}
                    size={input.icon ? 'lg' : undefined}
                  />
                </Tooltip>
              );
            }

            if (input.type === 'select') {
              return (
                <Select
                  key={idx}
                  label={input.label}
                  disabled={input.disabled}
                  data={input.selectOptions!}
                  size="xs"
                  style={{ width: '150px' }}
                  value={value[key]}
                  onChange={(v) => {
                    setValue(key, v);
                    state?.onBlur?.(
                      key,
                      v,
                      { ...value, [key]: v },
                      value,
                      state
                    );
                  }}
                />
              );
            }

            if (input.type === 'color') {
              return (
                <ColorInput
                  key={idx}
                  label={input.label}
                  disabled={input.disabled}
                  value={value[key]}
                  size="xs"
                  onChange={(value) => setValue(key, value)}
                  onChangeEnd={(v) => {
                    setValue(key, v);
                    state?.onBlur?.(
                      key,
                      v,
                      { ...value, [key]: v },
                      value,
                      state
                    );
                  }}
                  swatches={[
                    'rgba(0,0,0,0)',
                    '#25262b',
                    '#868e96',
                    '#fa5252',
                    '#e64980',
                    '#be4bdb',
                    '#7950f2',
                    '#4c6ef5',
                    '#228be6',
                    '#15aabf',
                    '#12b886',
                    '#40c057',
                    '#82c91e',
                    '#fab005',
                    '#fd7e14'
                  ]}
                  format="rgba"
                />
              );
            }

            if (input.type === 'radio') {
              return (
                <Group key={idx} noWrap>
                  {input.radioOptions?.map((option, idx) => (
                    <Checkbox
                      key={option.value}
                      mt={10}
                      mr={8}
                      style={{ alignSelf: 'flex-end' }}
                      styles={{
                        label: { fontSize: '0.875rem', cursor: 'pointer' },
                        input: { cursor: 'pointer' }
                      }}
                      icon={({ className }) =>
                        option.icon ? (
                          <option.icon className={className} />
                        ) : (
                          <IconCheck className={className} />
                        )
                      }
                      disabled={input.disabled}
                      label={option.label ? option.label : undefined}
                      indeterminate={
                        option.icon ? value[key] !== option.value : false
                      }
                      checked={value[key] === option.value}
                      onChange={(e) => {
                        setValue(key, option.value);
                        const newValue = {
                          ...value,
                          [key]: option.value
                        };
                        state.onBlur?.(
                          key,
                          option.value,
                          newValue,
                          value,
                          state
                        );
                      }}
                      size={option.icon ? 'lg' : undefined}
                    />
                  ))}
                </Group>
              );
            }
          })}
        </Group>
      ))}
    </Stack>
  );
};

export const unitInputGroupBlur = ({
  unitKey,
  valueKeys
}: {
  unitKey: string;
  valueKeys: string[];
}) => {
  return (
    key: string,
    value: any,
    _values: Record<string, any>,
    oldState: Record<string, any>,
    state: any
  ) => {
    let values = { ..._values };

    // Convert all values to the new unit if unit has changed
    if (key === unitKey) {
      for (const unitValue of valueKeys) {
        values[unitValue] = convertUnit(
          values[unitValue],
          oldState[unitKey],
          values[unitKey]
        );
        state.setValue(unitValue, values[unitValue]);
      }
    }

    state.updateCanvas?.(values);
  };
};
