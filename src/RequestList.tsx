import { Request } from "./types"
import { CAR} from "@ucanto/core"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import { isCarRequest, messageFromRequest, getRequestStatus, getStatusColor } from "./util";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

function RequestEntry({ request, selectedRequest, selectRequest } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void}) {
  const message = messageFromRequest(request)
  const status = getRequestStatus(request);
  
  return (
    <TableRow onClick={() => selectRequest(request)} hover selected={request === selectedRequest}>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FiberManualRecordIcon 
            sx={{ 
              color: getStatusColor(status), 
              fontSize: 16,
              mr: 1
            }} 
          />
          {request.request.url}
        </Box>
      </TableCell>
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