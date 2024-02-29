import { Trans, t } from '@lingui/macro';
import {
  ActionIcon,
  Anchor,
  Badge,
  CopyButton,
  Group,
  Paper,
  Skeleton,
  Table,
  Text,
  Tooltip
} from '@mantine/core';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useMemo } from 'react';

import { api } from '../App';
import { ProgressBar } from '../components/items/ProgressBar';
import { getModelInfo } from '../components/render/ModelType';
import { ApiEndpoints } from '../enums/ApiEndpoints';
import { ModelType } from '../enums/ModelType';
import { InvenTreeIcon, InvenTreeIconType } from '../functions/icons';
import { getDetailUrl } from '../functions/urls';
import { apiUrl } from '../states/ApiState';
import { useGlobalSettingsState } from '../states/SettingsState';

export type PartIconsType = {
  assembly: boolean;
  template: boolean;
  component: boolean;
  trackable: boolean;
  purchaseable: boolean;
  saleable: boolean;
  virtual: boolean;
  active: boolean;
};

export type DetailsField =
  | {
      name: string;
      label?: string;
      badge?: BadgeType;
      copy?: boolean;
      value_formatter?: () => ValueFormatterReturn;
    } & (StringDetailField | LinkDetailField | ProgressBarfield);

type BadgeType = 'owner' | 'user' | 'group';
type ValueFormatterReturn = string | number | null;

type StringDetailField = {
  type: 'string' | 'text';
  unit?: boolean;
};

type LinkDetailField = {
  type: 'link';
} & (InternalLinkField | ExternalLinkField);

type InternalLinkField = {
  model: ModelType;
};

type ExternalLinkField = {
  external: true;
};

type ProgressBarfield = {
  type: 'progressbar';
  progress: number;
  total: number;
};

type FieldValueType = string | number | undefined;

type FieldProps = {
  field_data: any;
  field_value: string | number;
  unit?: string | null;
};

/**
 * Fetches and wraps an InvenTreeIcon in a flex div
 * @param icon name of icon
 *
 */
function PartIcon(icon: InvenTreeIconType) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <InvenTreeIcon icon={icon} />
    </div>
  );
}

/**
 * Generates a table cell with Part icons.
 * Only used for Part Model Details
 */
function PartIcons({
  assembly,
  template,
  component,
  trackable,
  purchaseable,
  saleable,
  virtual,
  active
}: PartIconsType) {
  return (
    <td colSpan={2}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {!active && (
          <Tooltip label={t`Part is not active`}>
            <Badge color="red" variant="filled">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <InvenTreeIcon icon="inactive" iconProps={{ size: 19 }} />{' '}
                <Trans>Inactive</Trans>
              </div>
            </Badge>
          </Tooltip>
        )}
        {template && (
          <Tooltip
            label={t`Part is a template part (variants can be made from this part)`}
            children={PartIcon('template')}
          />
        )}
        {assembly && (
          <Tooltip
            label={t`Part can be assembled from other parts`}
            children={PartIcon('assembly')}
          />
        )}
        {component && (
          <Tooltip
            label={t`Part can be used in assemblies`}
            children={PartIcon('component')}
          />
        )}
        {trackable && (
          <Tooltip
            label={t`Part stock is tracked by serial number`}
            children={PartIcon('trackable')}
          />
        )}
        {purchaseable && (
          <Tooltip
            label={t`Part can be purchased from external suppliers`}
            children={PartIcon('purchaseable')}
          />
        )}
        {saleable && (
          <Tooltip
            label={t`Part can be sold to customers`}
            children={PartIcon('saleable')}
          />
        )}
        {virtual && (
          <Tooltip label={t`Part is virtual (not a physical part)`}>
            <Badge color="yellow" variant="filled">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <InvenTreeIcon icon="virtual" iconProps={{ size: 18 }} />{' '}
                <Trans>Virtual</Trans>
              </div>
            </Badge>
          </Tooltip>
        )}
      </div>
    </td>
  );
}

/**
 * Fetches user or group info from backend and formats into a badge.
 * Badge shows username, full name, or group name depending on server settings.
 * Badge appends icon to describe type of Owner
 */
function NameBadge({ pk, type }: { pk: string | number; type: BadgeType }) {
  const { data } = useSuspenseQuery({
    queryKey: ['badge', type, pk],
    queryFn: async () => {
      let path: string = '';

      switch (type) {
        case 'owner':
          path = ApiEndpoints.owner_list;
          break;
        case 'user':
          path = ApiEndpoints.user_list;
          break;
        case 'group':
          path = ApiEndpoints.group_list;
          break;
      }

      const url = apiUrl(path, pk);

      return api
        .get(url)
        .then((response) => {
          switch (response.status) {
            case 200:
              return response.data;
            default:
              return null;
          }
        })
        .catch(() => {
          return null;
        });
    }
  });

  const settings = useGlobalSettingsState();

  // Rendering a user's rame for the badge
  function _render_name() {
    if (type === 'user' && settings.isSet('DISPLAY_FULL_NAMES')) {
      if (data.first_name || data.last_name) {
        return `${data.first_name} ${data.last_name}`;
      } else {
        return data.username;
      }
    } else if (type === 'user') {
      return data.username;
    } else {
      return data.name;
    }
  }

  return (
    <Suspense fallback={<Skeleton width={200} height={20} radius="xl" />}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Badge
          color="dark"
          variant="filled"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {data.name ?? _render_name()}
        </Badge>
        <InvenTreeIcon icon={type === 'user' ? type : data.label} />
      </div>
    </Suspense>
  );
}

/**
 * Renders the value of a 'string' or 'text' field.
 * If owner is defined, only renders a badge
 * If user is defined, a badge is rendered in addition to main value
 */
function TableStringValue(props: FieldProps) {
  let value = props.field_value;

  if (props.field_data.value_formatter) {
    value = props.field_data.value_formatter();
  }

  if (props.field_data.badge) {
    return <NameBadge pk={value} type={props.field_data.badge} />;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Suspense fallback={<Skeleton width={200} height={20} radius="xl" />}>
        <span>
          {value ? value : props.field_data.unit && '0'}{' '}
          {props.field_data.unit == true && props.unit}
        </span>
      </Suspense>
      {props.field_data.user && (
        <NameBadge pk={props.field_data.user} type="user" />
      )}
    </div>
  );
}

function TableAnchorValue(props: FieldProps) {
  if (props.field_data.external) {
    return (
      <Anchor
        href={`${props.field_value}`}
        target={'_blank'}
        rel={'noreferrer noopener'}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Text>{props.field_value}</Text>
          <InvenTreeIcon icon="external" iconProps={{ size: 15 }} />
        </span>
      </Anchor>
    );
  }

  const { data } = useSuspenseQuery({
    queryKey: ['detail', props.field_data.model, props.field_value],
    queryFn: async () => {
      const modelDef = getModelInfo(props.field_data.model);

      if (!modelDef.api_endpoint) {
        return {};
      }

      const url = apiUrl(modelDef.api_endpoint, props.field_value);

      return api
        .get(url)
        .then((response) => {
          switch (response.status) {
            case 200:
              return response.data;
            default:
              return null;
          }
        })
        .catch(() => {
          return null;
        });
    }
  });

  const detailUrl = useMemo(() => {
    return getDetailUrl(props.field_data.model, props.field_value);
  }, [props.field_data.model, props.field_value]);

  return (
    <Suspense fallback={<Skeleton width={200} height={20} radius="xl" />}>
      <Anchor
        href={`/platform${detailUrl}`}
        target={data?.external ? '_blank' : undefined}
        rel={data?.external ? 'noreferrer noopener' : undefined}
      >
        <Text>{data.name ?? 'No name defined'}</Text>
      </Anchor>
    </Suspense>
  );
}

function ProgressBarValue(props: FieldProps) {
  return (
    <ProgressBar
      value={props.field_data.progress}
      maximum={props.field_data.total}
      progressLabel
    />
  );
}

function CopyField({ value }: { value: string }) {
  return (
    <CopyButton value={value}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? t`Copied` : t`Copy`} withArrow>
          <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
            {copied ? (
              <InvenTreeIcon icon="check" />
            ) : (
              <InvenTreeIcon icon="copy" />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}

function TableField({
  field_data,
  field_value,
  unit = null
}: {
  field_data: DetailsField[];
  field_value: FieldValueType[];
  unit?: string | null;
}) {
  function getFieldType(type: string) {
    switch (type) {
      case 'text':
      case 'string':
        return TableStringValue;
      case 'link':
        return TableAnchorValue;
      case 'progressbar':
        return ProgressBarValue;
    }
  }

  return (
    <tr>
      <td
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          justifyContent: 'flex-start'
        }}
      >
        <InvenTreeIcon icon={field_data[0].name as InvenTreeIconType} />
        <Text>{field_data[0].label}</Text>
      </td>
      <td style={{ minWidth: '40%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              flexGrow: '1'
            }}
          >
            {field_data.map((data: DetailsField, index: number) => {
              let FieldType: any = getFieldType(data.type);
              return (
                <FieldType
                  field_data={data}
                  field_value={field_value[index]}
                  unit={unit}
                  key={index}
                />
              );
            })}
          </div>
          {field_data[0].copy && <CopyField value={`${field_value[0]}`} />}
        </div>
      </td>
    </tr>
  );
}

export function DetailsTable({
  item,
  fields,
  partIcons = false
}: {
  item: any;
  fields: DetailsField[][];
  partIcons?: boolean;
}) {
  return (
    <Paper p="xs" withBorder radius="xs">
      <Table striped>
        <tbody>
          {partIcons && (
            <tr>
              <PartIcons
                assembly={item.assembly}
                template={item.is_template}
                component={item.component}
                trackable={item.trackable}
                purchaseable={item.purchaseable}
                saleable={item.salable}
                virtual={item.virtual}
                active={item.active}
              />
            </tr>
          )}
          {fields.map((data: DetailsField[], index: number) => {
            let value: FieldValueType[] = [];
            for (const val of data) {
              if (val.value_formatter) {
                value.push(undefined);
              } else {
                value.push(item[val.name]);
              }
            }

            return (
              <TableField
                field_data={data}
                field_value={value}
                key={index}
                unit={item.units}
              />
            );
          })}
        </tbody>
      </Table>
    </Paper>
  );
}
