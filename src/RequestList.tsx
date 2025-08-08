import { Request } from "./types"
import { CAR} from "@ucanto/core"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { isCarRequest, messageFromRequest } from "./util";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function getRequestStatus(request: Request) {
  const httpStatus = request.response.status;
  const isHttpSuccess = httpStatus >= 200 && httpStatus < 300;
  const isHttpError = httpStatus >= 400;
  
  const message = messageFromRequest(request);
  let hasReceiptError = false;
  
  if (typeof message !== 'string' && message.receipts.size > 0) {
    for (const receipt of message.receipts.values()) {
      if (receipt.out.error !== undefined) {
        hasReceiptError = true;
        break;
      }
    }
  }
  
  if (isHttpError || hasReceiptError) {
    return 'error';
  } else if (isHttpSuccess && !hasReceiptError) {
    return 'success';
  } else {
    return 'pending';
  }
}

function RequestEntry({ request, selectedRequest, selectRequest } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void}) {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <TableRow onClick={() => selectRequest(request)} hover selected={request === selectedRequest}>
      <TableCell>
        <FiberManualRecordIcon 
          sx={{ 
            color: getStatusColor(status), 
            fontSize: 16 
          }} 
        />
      </TableCell>
      <TableCell>{request.request.url}</TableCell>
      <TableCell>{ typeof message === 'string' ? message : message.invocations.flatMap((invocation) => invocation.capabilities.map((capability => capability.can))).join(", ")}</TableCell>
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest} : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void }) {
  const requestItems = requests.filter(isCarRequest).map(request => <RequestEntry selectedRequest={selectedRequest} selectRequest={selectRequest} request={request} />)
  return (
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Table
      stickyHeader
      aria-labelledby="tableTitle"
      size={'medium'}
    >
      <TableHead>
        <TableCell>Status</TableCell>
        <TableCell>URL</TableCell>
        <TableCell>Capabilities</TableCell>
      </TableHead>
      <TableBody>
      { requestItems }
      </TableBody>
    </Table>
    </TableContainer>
  )
}

export default RequestList