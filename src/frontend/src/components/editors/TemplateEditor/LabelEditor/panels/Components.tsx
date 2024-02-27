import { t } from '@lingui/macro';
import {
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Title
} from '@mantine/core';
import { TablerIconsProps } from '@tabler/icons-react';
import { useCallback, useState } from 'react';

import { convertUnit, units } from '../utils';

const inputTemplates: Record<string, InputGroupInputProps> = {
  unit: {
    key: '',
    label: t`Unit`,
    type: 'select',
    defaultValue: 'mm',
    selectOptions: Object.entries(units).map(([key, value]) => ({
      value: key,
      label: value.name
    }))
  }
};

type InputGroupInputProps = {
  key: string;
  disabled?: boolean;
} & {
  label?: string;
  type?: 'number' | 'boolean' | 'select';
  defaultValue?: number | boolean | string;
  selectOptions?: { value: string; label: string }[];
  template?: keyof typeof inputTemplates;
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
    state: UseInputGroupProps<T>
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
  const [state, setState] = useState(() => {
    const _state: Record<string, any> = {};
    inputRows.forEach((row) => {
      row.columns.forEach((_input) => {
        let input = _input;
        if (input.template) {
          input = { ...inputTemplates[input.template], ..._input };
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
      state: UseInputGroupProps<T>
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
  state: InputGroupProps<T>;
}) => {
  const { name, icon: Icon, inputRows, value, setValue: _setValue } = state;
  const setValue = useCallback(
    (key: string, value: any) => {
      _setValue(key, value, true);
    },
    [_setValue]
  );

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
              input = { ...inputTemplates[input.template], ..._input };
            }
            const key = `${row.key}.${input.key}`;

            if (input.type === 'number') {
              return (
                <NumberInput
                  key={idx}
                  size="xs"
                  disabled={input.disabled}
                  label={input.label}
                  value={value[key]}
                  onChange={(value) => setValue(key, value)}
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
                />
              );
            }

            if (input.type === 'boolean') {
              return (
                <Switch
                  key={idx}
                  label={input.label}
                  disabled={input.disabled}
                  mt={5}
                  checked={value[key]}
                  onChange={(e) => setValue(key, e.currentTarget.checked)}
                  onBlur={() =>
                    state.onBlur?.(key, value[key], value, value, state)
                  }
                />
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
