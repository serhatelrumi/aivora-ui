import React, { useState } from 'react';
import { Button, Segmented, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportReport } from '../utils/reportExport';

const ReportExportBar = ({ data, reportType, filenameBase, meta, disabled }) => {
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (!data) {
      message.warning('Önce raporu yükleyin (Rapor Al).');
      return;
    }
    setBusy(true);
    try {
      await exportReport({
        format,
        reportType,
        data,
        filename: filenameBase,
        meta,
      });
      message.success(format === 'pdf' ? 'PDF indirildi.' : 'Excel indirildi.');
    } catch (e) {
      message.error(e.message || 'Dışa aktarma başarısız.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Segmented
        value={format}
        onChange={setFormat}
        options={[
          { label: 'PDF', value: 'pdf' },
          { label: 'Excel', value: 'excel' },
        ]}
        size="small"
      />
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        loading={busy}
        disabled={disabled || !data}
      >
        Dışa Aktar
      </Button>
    </div>
  );
};

export default ReportExportBar;
