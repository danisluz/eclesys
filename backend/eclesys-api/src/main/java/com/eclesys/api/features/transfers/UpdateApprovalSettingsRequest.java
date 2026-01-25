package com.eclesys.api.features.transfers;

import com.eclesys.api.domain.tenant.ApprovalLevel;

public record UpdateApprovalSettingsRequest(
    ApprovalLevel internalSameSectorApproval,
    ApprovalLevel internalCrossSectorApproval,
    ApprovalLevel externalApproval,
    Boolean requireJustificationOnRejection,
    Boolean allowRequesterCancel
) {
}
