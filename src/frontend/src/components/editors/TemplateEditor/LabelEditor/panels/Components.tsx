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

const inputTemplates: Record<string, InputGroupInputProps> = {
  unit: {
    key: '',
    label: t`Unit`,
    type: 'select',
    defaultValue: 'mm',
    selectOptions: [
      { value: 'px', label: 'px' },
      { value: 'mm', label: 'mm' },
      { value: 'cm', label: 'cm' },
      { value: 'in', label: 'in' }
    ]
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

type UseInputGroupProps = {
  name: string;
  icon: (props: TablerIconsProps) => JSX.Element;
  inputRows: InputGroupRow[];
  onChange?: (key: string, value: any, allValues: Record<string, any>) => void;
  onBlur?: (key: string, value: any, allValues: Record<string, any>) => void;
};

export const useInputGroupState = (props: UseInputGroupProps) => {
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

  return {
    ...props,
    value: state,
    setValue
  };
};

type InputGroupProps = Omit<UseInputGroupProps, 'onChange'> & {
  value: Record<string, any>;
  setValue: (key: string, value: any, trigger: boolean) => void;
};

export const InputGroup = ({ state }: { state: InputGroupProps }) => {
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
                  onBlur={() => state.onBlur?.(key, value[key], value)}
                  precision={10}
                  formatter={(value) => {
                    let v = parseFloat(value);

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
                  onBlur={() => state.onBlur?.(key, value[key], value)}
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
                    state?.onBlur?.(key, v, { ...value, [key]: v });
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
